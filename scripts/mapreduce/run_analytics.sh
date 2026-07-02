#!/bin/bash
set -euo pipefail
# Run all MapReduce analytics jobs on HDFS
# Designed to run inside the hadoop-job container.

HDFS_INPUT_TXN="/backups/transactions"
HDFS_INPUT_RED="/backups/redemptions"
HDFS_OUTPUT_BASE="/backups/analytics"
STREAMING_JAR="$HADOOP_STREAMING_JAR"
MAPPER_BASE="/opt/mapreduce"

latest_file() {
  hdfs dfs -ls "$1" 2>/dev/null | grep '^-' | sort -k6,7 | tail -1 | awk '{print $NF}'
}

TX_LATEST=$(latest_file "$HDFS_INPUT_TXN")
RED_LATEST=$(latest_file "$HDFS_INPUT_RED")

echo "  Latest txn file: $TX_LATEST"
echo "  Latest red file: $RED_LATEST"

JOBS=(
  "user_points:$TX_LATEST:total_points_per_user"
  "daily_count:$TX_LATEST:transactions_per_day"
  "category_rank:$TX_LATEST:category_ranking"
  "reward_rank:$RED_LATEST:reward_ranking"
  "machine_usage:$TX_LATEST:machine_usage"
)

echo "=== Creating output dir: $HDFS_OUTPUT_BASE ==="
hdfs dfs -mkdir -p "$HDFS_OUTPUT_BASE"

for job in "${JOBS[@]}"; do
  IFS=":" read -r job_type input_file output_name <<< "$job"
  output_dir="$HDFS_OUTPUT_BASE/$output_name"

  echo "=== Running MapReduce: $job_type ==="
  echo "  Input:  $input_file"
  echo "  Output: $output_dir"

  hdfs dfs -rm -r -f "$output_dir" 2>/dev/null || true

  cd /opt/mapreduce

  hadoop jar "$STREAMING_JAR" \
    -D mapreduce.job.name="trasmart-$job_type" \
    -cmdenv job_type="$job_type" \
    -input "$input_file" \
    -output "$output_dir" \
    -mapper "python3 mapper.py" \
    -reducer "python3 reducer.py" \
    -file mapper.py \
    -file reducer.py

  echo "  MapReduce done. Merging results..."

  # Convert part files to single CSV with header
  header=""
  case "$job_type" in
    user_points)   header="user_id,total_poin" ;;
    daily_count)   header="tanggal,jumlah_transaksi" ;;
    category_rank) header="category_id,total_poin" ;;
    reward_rank)   header="reward_id,total_redeem" ;;  # total redemptions ever
    machine_usage) header="machine_id,jumlah_pakai" ;;
  esac

  # Merge part files
  if hdfs dfs -test -e "$output_dir/part-00000" 2>/dev/null; then
    hdfs dfs -cat "$output_dir/part-*" | sort -t$'\t' -k2 -rn > /tmp/analytics_result.txt

    echo "$header" > /tmp/analytics_with_header.txt
    while IFS=$'\t' read -r key value; do
      [ -n "$key" ] && echo "$key,$value" >> /tmp/analytics_with_header.txt
    done < /tmp/analytics_result.txt

    hdfs dfs -put -f /tmp/analytics_with_header.txt "$output_dir/result.csv"
    hdfs dfs -rm -r "$output_dir/_SUCCESS" 2>/dev/null || true

    echo "  Done -> $output_dir/result.csv"
  else
    echo "  WARNING: No output part files for $job_type. Skipping result merge."
  fi
done

echo "=== All MapReduce jobs completed ==="
hdfs dfs -ls -R "$HDFS_OUTPUT_BASE"
