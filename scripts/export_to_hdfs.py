import os
import csv
import io
import logging
import subprocess
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
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
        timeout=60,
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


def get_last_backup_time(dir_path):
    """Find the latest backup timestamp from existing HDFS files."""
    files = hdfs_list(dir_path)
    if not files:
        return None
    timestamps = []
    for f in files:
        stamp = f["pathSuffix"].replace(".csv", "")
        try:
            ts = datetime.strptime(stamp, "%Y-%m-%d_%H%M%S")
            timestamps.append(ts)
        except ValueError:
            continue
    if not timestamps:
        return None
    return max(timestamps)


def stream_supabase(table, select="*", order="created_at", since=None, since_col="created_at"):
    """Stream rows from Supabase, optionally filtering by since_col >= since."""
    log.info("Streaming from Supabase: %s (since=%s)", table, since or "beginning")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    }
    params = f"select={select}&order={order}&limit={PAGE_SIZE}"
    if since:
        since_iso = since.strftime("%Y-%m-%dT%H:%M:%SZ") if hasattr(since, "strftime") else since
        params += f"&{since_col}=gte.{since_iso}"
    base_url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"

    start = 0
    total = 0
    while True:
        range_start = start
        range_end = start + PAGE_SIZE - 1
        headers["Range"] = f"{range_start}-{range_end}"
        resp = requests.get(base_url, headers=headers)
        if resp.status_code == 416:
            break
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        for row in batch:
            yield row
            total += 1
        log.info("  Streamed %d rows from %s (total: %d)", len(batch), table, total)
        start += PAGE_SIZE


def stream_write_csv(dir_path, filename, columns, row_iter):
    """Write CSV rows to HDFS incrementally without accumulating all in memory."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)

    count = 0
    for row in row_iter:
        writer.writerow(row)
        count += 1

    path = f"{dir_path}/{filename}"
    hdfs_write(path, buf.getvalue())
    return count


def get_today_stamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")


def main():
    check_env()
    log.info("Starting Supabase -> HDFS backup")
    log.info("Supabase URL: %s", SUPABASE_URL)

    hdfs_mkdir(BACKUP_DIR_TRANSACTIONS)
    hdfs_mkdir(BACKUP_DIR_REDEMPTIONS)

    # Incremental: find last backup time
    last_txn = get_last_backup_time(BACKUP_DIR_TRANSACTIONS)
    last_red = get_last_backup_time(BACKUP_DIR_REDEMPTIONS)

    txn_columns = [
        "id", "user_id", "category_id", "machine_id",
        "poin", "created_at", "status",
    ]
    red_columns = ["id", "user_id", "reward_id", "redeemed_at"]

    if last_txn:
        log.info("Incremental transactions backup since: %s", last_txn.isoformat())
    else:
        log.info("Full transactions backup (no previous data)")

    if last_red:
        log.info("Incremental redemptions backup since: %s", last_red.isoformat())
    else:
        log.info("Full redemptions backup (no previous data)")

    stamp = get_today_stamp()

    def txn_rows():
        for t in stream_supabase("transactions", since=last_txn):
            yield [
                t.get("id", ""),
                t.get("user_id", ""),
                t.get("category_id", ""),
                t.get("machine_id", "") or "",
                str(t.get("poin", 0)),
                t.get("created_at", ""),
                t.get("status", ""),
            ]

    def red_rows():
        for r in stream_supabase("user_redemptions", order="redeemed_at", since=last_red, since_col="redeemed_at"):
            yield [
                r.get("id", ""),
                r.get("user_id", ""),
                r.get("reward_id", ""),
                r.get("redeemed_at", "") or "",
            ]

    txn_count = stream_write_csv(BACKUP_DIR_TRANSACTIONS, f"{stamp}.csv", txn_columns, txn_rows())
    red_count = stream_write_csv(BACKUP_DIR_REDEMPTIONS, f"{stamp}.csv", red_columns, red_rows())

    log.info("Backup complete: %d transactions, %d redemptions written to HDFS", txn_count, red_count)


if __name__ == "__main__":
    main()
