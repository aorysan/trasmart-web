#!/usr/bin/env python3
"""
Hadoop Streaming mapper for TrasMart analytics.
Reads CSV lines from stdin, emits (key, value) pairs.
Skips the CSV header line automatically.

Job types (passed via -cmdenv job_type=):
  user_points    -> key: user_id        value: poin
  daily_count    -> key: date           value: 1
  category_rank  -> key: category_id    value: poin
  reward_rank    -> key: reward_id      value: 1
  machine_usage  -> key: machine_id     value: 1
"""
import os
import sys

JOB_TYPE = os.environ.get("job_type", "user_points")

def parse_csv_line(line):
    """Simple CSV parser (no quotes handling needed for our clean CSVs)."""
    return [col.strip() for col in line.split(",")]

def emit(key, value):
    sys.stdout.write("{}\t{}\n".format(key, value))

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue

    cols = parse_csv_line(line)

    if JOB_TYPE == "user_points":
        if cols[0] == "id" and cols[1] == "user_id":
            continue
        if len(cols) >= 5:
            user_id = cols[1]
            poin = cols[4]
            if user_id:
                emit(user_id, poin)

    elif JOB_TYPE == "daily_count":
        if cols[0] == "id" and cols[1] == "user_id":
            continue
        if len(cols) >= 6:
            created_at = cols[5]
            if created_at:
                date_part = created_at[:10]
                emit(date_part, "1")

    elif JOB_TYPE == "category_rank":
        if cols[0] == "id" and cols[1] == "user_id":
            continue
        if len(cols) >= 3:
            category_id = cols[2]
            poin = cols[4]
            if category_id:
                emit(category_id, poin)

    elif JOB_TYPE == "reward_rank":
        if cols[0] == "id" and cols[1] == "user_id":
            continue
        if len(cols) >= 3:
            reward_id = cols[2]
            if reward_id:
                emit(reward_id, "1")

    elif JOB_TYPE == "machine_usage":
        if cols[0] == "id" and cols[1] == "user_id":
            continue
        if len(cols) >= 4:
            machine_id = cols[3]
            if machine_id:
                emit(machine_id, "1")
