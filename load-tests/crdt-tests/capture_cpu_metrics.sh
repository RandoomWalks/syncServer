#!/bin/bash

# Output file to store system metrics
output_file="system-metrics.log"
echo > $output_file

# Function to capture system metrics
capture_metrics() {
    # Timestamp
    echo "------------------------------------" >> "$output_file"
    date >> "$output_file"
    echo "------------------------------------" >> "$output_file"

    # System load averages
    echo "System Load Averages:" >> "$output_file"
    uptime >> "$output_file"
    echo "" >> "$output_file"

    # Memory usage
    echo "Memory Usage:" >> "$output_file"
    free -h >> "$output_file"
    echo "" >> "$output_file"

    # Disk space usage
    echo "Disk Space Usage:" >> "$output_file"
    df -h >> "$output_file"
    echo "" >> "$output_file"

    # Disk I/O statistics
    echo "Disk I/O Statistics:" >> "$output_file"
    iostat -x 2 2 >> "$output_file"
    echo "" >> "$output_file"

    # Network activity
    echo "Network Activity:" >> "$output_file"
    sar -n DEV 1 2 >> "$output_file"
    echo "" >> "$output_file"

    # Process-specific information
    echo "Top Processes:" >> "$output_file"
    ps aux --sort=-%cpu | head -n 10 >> "$output_file"
    echo "" >> "$output_file"
}

# Capture system metrics every 10 seconds
while true; do
    capture_metrics
    sleep 5
done

