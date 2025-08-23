#!/bin/bash

# Clean up sensitive and temporary files before GitHub upload

echo "Cleaning up sensitive files..."

# Remove sensitive files
if [ -f ".env" ]; then
    echo "Removing .env file..."
    rm .env
fi

if [ -f "server.log" ]; then
    echo "Removing server.log file..."
    rm server.log
fi

if [ -f "debug-image-tracking.js" ]; then
    echo "Removing debug-image-tracking.js..."
    rm debug-image-tracking.js
fi

# Remove any .env backup files
find . -name ".env.*" -not -name ".env.example" -type f -delete

# Remove log files
find . -name "*.log" -type f -delete

# Remove temporary files
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete

# Remove IDE specific files
find . -name ".vscode" -type d -exec rm -rf {} +
find . -name ".idea" -type d -exec rm -rf {} +

# Remove OS generated files
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete

echo "Cleanup complete!"
echo ""
echo "Files removed:"
echo "- .env (contains database credentials and app secret)"
echo "- server.log (contains server logs with sensitive information)"
echo "- debug-image-tracking.js (contains debug information)"
echo "- Any .env backup files"
echo "- Log files (*.log)"
echo "- Temporary files (*.tmp, *.temp)"
echo "- IDE configuration files (.vscode, .idea)"
echo "- OS generated files (.DS_Store, Thumbs.db)"
echo ""
echo "Important: Before deploying, you'll need to:"
echo "1. Create a new .env file with your actual credentials"
echo "2. Generate a new APP_SECRET"