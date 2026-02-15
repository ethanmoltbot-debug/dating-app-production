#!/bin/bash

set -e

echo "🚀 Starting EAS Build & TestFlight Upload..."

# Step 1: Build with EAS
echo "📱 Building iOS app with EAS Cloud..."
npx eas-cli build --platform ios --wait

# Step 2: Download the IPA
echo "⬇️  Downloading signed IPA..."
BUILD_ID=$(eas buildinfo --latest --json | jq -r '.[0].id')
npx eas-cli build:download --id $BUILD_ID --path ./app.ipa

echo "✅ IPA downloaded: ./app.ipa"

# Step 3: Upload to TestFlight
echo "📤 Uploading to TestFlight..."
xcrun altool --upload-app -f ./app.ipa -t ios -u offthegridtravelers@gmail.com -p "ombi-vhvt-svrc-axlf"

echo "🎉 SUCCESS! App uploaded to TestFlight"
echo "Check https://appstoreconnect.apple.com for status"
