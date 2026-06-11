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
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
HDFS_CONTAINER = "hadoop-namenode"

BACKUP_DIR_TRANSACTIONS = "/backups/transactions"
BACKUP_DIR_REDEMPTIONS = "/backups/redemptions"
BACKUP_DIR_PROFILES   = "/backups/profiles"
BACKUP_DIR_REFERENCE  = "/backups/reference"
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
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"hdfs cmd failed: {' '.join(cmd)}\n{result.stderr}")
    return result.stdout


def hdfs_mkdir(path):
    log.info("Creating HDFS directory: %s", path)
    hdfs_cmd("hdfs", "dfs", "-mkdir", "-p", path)


def hdfs_write(path, data):
    hdfs_cmd("hdfs", "dfs", "-mkdir", "-p", os.path.dirname(path))
    hdfs_cmd("hdfs", "dfs", "-put", "-", path, input_text=data)
    log.info("Wrote %d bytes to HDFS: %s", len(data.encode("utf-8")), path)


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


def fetch_all_supabase(table, select="*", order="created_at"):
    """Fetch ALL rows from Supabase (full snapshot)."""
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
        headers["Range"] = f"{start}-{start + PAGE_SIZE - 1}"
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


def write_csv(path, columns, rows):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    for row in rows:
        writer.writerow(row)
    hdfs_write(path, buf.getvalue())
    return len(rows)


def supabase_count(table):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
        "Prefer": "count=exact",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=0"
    try:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        range_header = resp.headers.get("content-range", "*/0")
        return int(range_header.split("/")[-1])
    except Exception:
        return 0


def get_today_stamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")


def main():
    check_env()
    log.info("Starting Supabase -> HDFS full backup")
    log.info("Supabase URL: %s", SUPABASE_URL)

    hdfs_mkdir(BACKUP_DIR_TRANSACTIONS)
    hdfs_mkdir(BACKUP_DIR_REDEMPTIONS)
    hdfs_mkdir(BACKUP_DIR_PROFILES)
    hdfs_mkdir(BACKUP_DIR_REFERENCE)

    stamp = get_today_stamp()

    # ---------- transactions ----------
    txns = fetch_all_supabase("transactions")
    txn_cols = ["id", "user_id", "category_id", "machine_id", "poin", "created_at", "status"]
    txn_rows = [[
        t.get("id", ""), t.get("user_id", ""), t.get("category_id", ""),
        t.get("machine_id", "") or "", str(t.get("poin", 0)),
        t.get("created_at", ""), t.get("status", ""),
    ] for t in txns]
    txn_count = write_csv(f"{BACKUP_DIR_TRANSACTIONS}/{stamp}.csv", txn_cols, txn_rows)

    # ---------- redemptions ----------
    reds = fetch_all_supabase("user_redemptions", order="redeemed_at")
    red_cols = ["id", "user_id", "reward_id", "redeemed_at"]
    red_rows = [[
        r.get("id", ""), r.get("user_id", ""),
        r.get("reward_id", ""), r.get("redeemed_at", "") or "",
    ] for r in reds]
    red_count = write_csv(f"{BACKUP_DIR_REDEMPTIONS}/{stamp}.csv", red_cols, red_rows)

    # ---------- profiles (non-sensitive) ----------
    profs = fetch_all_supabase("profiles", order="updated_at")
    prof_cols = ["id", "city", "points"]
    prof_rows = [[
        p.get("id", ""), p.get("city", "") or "", str(p.get("points", 0)),
    ] for p in profs]
    prof_count = write_csv(f"{BACKUP_DIR_PROFILES}/profiles.csv", prof_cols, prof_rows)

    # ---------- reference tables (static, overwrite) ----------
    cats = fetch_all_supabase("trash_categories")
    cat_cols = ["id", "name", "poin"]
    cat_rows = [[c.get("id", ""), c.get("name", ""), str(c.get("poin", 0))] for c in cats]
    write_csv(f"{BACKUP_DIR_REFERENCE}/trash_categories.csv", cat_cols, cat_rows)

    rwds = fetch_all_supabase("rewards")
    rwd_cols = ["id", "name", "points_required", "quantity"]
    rwd_rows = [[r.get("id", ""), r.get("name", ""), str(r.get("points_required", 0)), str(r.get("quantity", 0))] for r in rwds]
    write_csv(f"{BACKUP_DIR_REFERENCE}/rewards.csv", rwd_cols, rwd_rows)

    machs = fetch_all_supabase("machines")
    mach_cols = ["id", "name", "location_label", "status"]
    mach_rows = [[m.get("id", ""), m.get("name", ""), m.get("location_label", ""), m.get("status", "")] for m in machs]
    write_csv(f"{BACKUP_DIR_REFERENCE}/machines.csv", mach_cols, mach_rows)

    log.info("Backup complete: %d transactions, %d redemptions, %d profiles", txn_count, red_count, prof_count)


if __name__ == "__main__":
    main()
