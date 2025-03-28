
#!/bin/bash

# Download the ZIP file from Box
echo "Downloading assets from Box..."
curl -L https://yale.box.com/shared/static/cncl-comp-inf-assets --output assets.zip

# Remove old assets folder if it exists
if [ -d "assets" ]; then
    echo "Removing old assets folder..."
    rm -rf assets
fi

# Extract the ZIP file
echo "Extracting assets.zip..."
unzip assets.zip -d assets

# Clean up
rm assets.zip

echo "Setup complete. Folder is now named 'assets'."

# Make executable

chmod +x startup.sh

# Run

npm run build
npm start
