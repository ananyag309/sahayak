#!/bin/bash

# This script fixes the CORS (Cross-Origin Resource Sharing) issue
# that prevents the web application from uploading files to Firebase Storage.

# To run this script:
# 1. Make sure you have the Google Cloud CLI installed (https://cloud.google.com/sdk/docs/install).
# 2. Authenticate with Google Cloud: `gcloud auth login`
# 3. Set your project ID: `gcloud config set project sahayak-465019`
# 4. Make this script executable: `chmod +x firebase-cors-fix.sh`
# 5. Run the script: `./firebase-cors-fix.sh`

# Get the Project ID from gcloud config
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
    echo "GCP Project ID not set. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

# Get the default storage bucket URL for the project
BUCKET_URL="gs://${PROJECT_ID}.appspot.com"
echo "Using storage bucket: $BUCKET_URL"

# Create a CORS configuration file
cat > cors-config.json << EOL
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOL

echo "Generated cors-config.json:"
cat cors-config.json

# Apply the CORS configuration to the bucket using gsutil
echo "Applying CORS configuration to $BUCKET_URL..."
gsutil cors set cors-config.json "$BUCKET_URL"

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "CORS policy updated successfully for bucket $BUCKET_URL."
  echo "The Textbook Scanner and other upload features should now work correctly."
else
  echo "Error applying CORS configuration. Please check your permissions and ensure gsutil is installed and configured."
fi

# Clean up the configuration file
rm cors-config.json
