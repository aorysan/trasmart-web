#!/usr/bin/env python3
"""
Hadoop Streaming reducer for TrasMart analytics.
Reads sorted (key, value) pairs from stdin, aggregates numeric values.
"""
import sys

current_key = None
current_sum = 0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue

    parts = line.split("\t", 1)
    if len(parts) != 2:
        continue

    key, value = parts

    try:
        numeric_value = int(value)
    except ValueError:
        continue

    if key == current_key:
        current_sum += numeric_value
    else:
        if current_key is not None:
            sys.stdout.write("{}\t{}\n".format(current_key, current_sum))
        current_key = key
        current_sum = numeric_value

if current_key is not None:
    sys.stdout.write("{}\t{}\n".format(current_key, current_sum))
