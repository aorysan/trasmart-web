"""
ETL: Export data from Supabase to HDFS (via docker exec).
Usage:
    python export_to_hdfs.py

Environment variables:
    SUPABASE_URL          (required)
    SUPABASE_SERVICE_KEY  (required)
"""

import os
import csv
import io
import logging
import subprocess
import sys
from datetime import datetime, timezone

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zvutdbjkfqstmlpxvqzh.supabase.co").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXRkYmprZnFzdG1scHh2cXpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTcyNywiZXhwIjoyMDkxODAxNzI3fQ.yYAKtKpxGsZNME394x4jFPm8G9rC7Ad2bHqEQA98Y7A")
HDFS_CONTAINER = "hadoop-namenode"

BACKUP_DIR_TRANSACTIONS = "/backups/transactions"
BACKUP_DIR_REDEMPTIONS = "/backups/redemptions"
PAGE_SIZE = 1000


def check_env():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)


def hdfs_cmd(*args, input_text=None):
    cmd = ["docker", "exec"]
    if input_text is not None:
        cmd.append("-i")
    cmd.append(HDFS_CONTAINER)
    cmd.extend(args)

    result = subprocess.run(
        cmd,
        input=input_text,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"hdfs cmd failed: {' '.join(cmd)}\n{result.stderr}")
    return result.stdout


def hdfs_mkdir(path):
    log.info("Creating HDFS directory: %s", path)
    hdfs_cmd("hdfs", "dfs", "-mkdir", "-p", path)


def hdfs_write(path, data):
    dir_path = os.path.dirname(path)
    hdfs_cmd("hdfs", "dfs", "-mkdir", "-p", dir_path)
    hdfs_cmd("hdfs", "dfs", "-put", "-", path, input_text=data)
    log.info("Wrote %d bytes to HDFS: %s", len(data.encode("utf-8")), path)


def hdfs_read(path):
    return hdfs_cmd("hdfs", "dfs", "-cat", path)


def hdfs_list(path):
    try:
        output = hdfs_cmd("hdfs", "dfs", "-ls", path)
    except RuntimeError:
        return []
    files = []
    for line in output.strip().split("\n"):
        if line.startswith("Found") or line.startswith("dr"):
            continue
        parts = line.split()
        if len(parts) >= 8:
            files.append({
                "pathSuffix": parts[7].split("/")[-1],
                "length": int(parts[4]),
                "modificationTime": f"{parts[5]} {parts[6]}",
                "type": "FILE",
            })
    return files


def hdfs_count_lines(file_path):
    try:
        output = hdfs_cmd("hdfs", "dfs", "-cat", file_path)
        lines = output.strip().split("\n")
        return max(len(lines) - 1, 0)
    except Exception:
        return 0


def fetch_supabase_all(table, select="*", order="created_at"):
    log.info("Fetching all rows from Supabase: %s", table)
    rows = []
    start = 0
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&order={order}&limit={PAGE_SIZE}"

    while True:
        range_start = start
        range_end = start + PAGE_SIZE - 1
        headers["Range"] = f"{range_start}-{range_end}"
        resp = requests.get(url, headers=headers)
        if resp.status_code == 416:
            break
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        rows.extend(batch)
        log.info("  Fetched %d rows (total: %d)", len(batch), len(rows))
        start += PAGE_SIZE

    return rows


def supabase_count(table):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
        "Prefer": "count=exact",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=0"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    count = resp.headers.get("content-range", "*/0").split("/")[-1]
    return int(count)


def get_today_stamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")


def export_transactions(transactions):
    stamp = get_today_stamp()
    path = f"{BACKUP_DIR_TRANSACTIONS}/{stamp}.csv"
    columns = [
        "id", "user_id", "category_id", "machine_id",
        "poin", "created_at", "status",
    ]
    rows = []
    for t in transactions:
        rows.append([
            t.get("id", ""),
            t.get("user_id", ""),
            t.get("category_id", ""),
            t.get("machine_id", "") or "",
            str(t.get("poin", 0)),
            t.get("created_at", ""),
            t.get("status", ""),
        ])
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    writer.writerows(rows)
    hdfs_write(path, buf.getvalue())
    return len(rows)


def export_redemptions(redemptions):
    stamp = get_today_stamp()
    path = f"{BACKUP_DIR_REDEMPTIONS}/{stamp}.csv"
    columns = ["id", "user_id", "reward_id", "redeemed_at"]
    rows = []
    for r in redemptions:
        rows.append([
            r.get("id", ""),
            r.get("user_id", ""),
            r.get("reward_id", ""),
            r.get("redeemed_at", "") or "",
        ])
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    writer.writerows(rows)
    hdfs_write(path, buf.getvalue())
    return len(rows)


def main():
    check_env()
    log.info("Starting Supabase → HDFS backup")
    log.info("Supabase URL: %s", SUPABASE_URL)

    hdfs_mkdir(BACKUP_DIR_TRANSACTIONS)
    hdfs_mkdir(BACKUP_DIR_REDEMPTIONS)

    transactions = fetch_supabase_all("transactions")
    redemptions = fetch_supabase_all("user_redemptions", order="redeemed_at")

    txn_count = export_transactions(transactions)
    red_count = export_redemptions(redemptions)

    log.info("Backup complete: %d transactions, %d redemptions written to HDFS", txn_count, red_count)


if __name__ == "__main__":
    main()
