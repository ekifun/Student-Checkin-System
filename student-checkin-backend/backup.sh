#!/bin/bash

BACKUP_DIR=~/sqlite-backups
DB_FILE=~/Student-Checkin-System/student-checkin-backend/data/checkin-system.db
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/checkin-system_${TIMESTAMP}.db

echo "✅ Backup complete: $BACKUP_DIR/checkin-system_${TIMESTAMP}.db"
