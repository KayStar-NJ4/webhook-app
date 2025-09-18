#!/bin/bash

# Build frontend and prepare for nginx
set -e

echo "Building frontend for production..."

# Create nginx html directory if not exists
mkdir -p nginx/html/admin

# Copy admin files to nginx directory
if [ -d "public/admin" ]; then
    echo "Copying admin files to nginx directory..."
    cp -r public/admin/* nginx/html/admin/
    echo "✅ Frontend files copied to nginx directory"
else
    echo "❌ public/admin directory not found!"
    exit 1
fi

echo "✅ Frontend build completed!"
