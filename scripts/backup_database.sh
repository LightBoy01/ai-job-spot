#!/bin/bash
#
# This script exports the production Firestore database to a Google Cloud Storage bucket.
#
# Prerequisites:
# 1. Google Cloud SDK (`gcloud`) must be installed and authenticated.
#    - Installation: https://cloud.google.com/sdk/docs/install
#    - Authentication: `gcloud auth login`
# 2. You must have a Google Cloud Storage bucket created.
#    - Create one here: https://console.cloud.google.com/storage/browser
# 3. Your user account must have the "Cloud Datastore Import Export Admin" IAM role.

# --- Configuration ---

# !!! IMPORTANT !!!
# Replace this with your actual Google Cloud Project ID.
PROJECT_ID="YOUR_PROJECT_ID"

# !!! IMPORTANT !!!
# Replace this with the name of your Google Cloud Storage bucket.
# It's recommended to create a dedicated bucket for backups.
BUCKET_NAME="YOUR_BUCKET_NAME"

# The collections to export. Add more collections as needed.
COLLECTIONS_TO_EXPORT="jobs,articles"

# The folder within the bucket to store the backup.
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
OUTPUT_URI_PREFIX="gs://${BUCKET_NAME}/firestore-backups/${TIMESTAMP}"

# --- Execution ---

echo "Starting Firestore export..."
echo "Project ID: ${PROJECT_ID}"
echo "Bucket: ${BUCKET_NAME}"
echo "Output Path: ${OUTPUT_URI_PREFIX}"

gcloud config set project ${PROJECT_ID}

gcloud firestore export ${OUTPUT_URI_PREFIX} \
    --collection-ids=${COLLECTIONS_TO_EXPORT} \
    --async

echo "-----------------------------------------------------"
echo "Export operation started successfully in the background."
echo "Monitor progress in the Google Cloud Console: https://console.cloud.google.com/datastore/import-export"
echo "-----------------------------------------------------"
