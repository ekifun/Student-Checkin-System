#!/bin/bash

# Deployment script for CheckInApp (Expo + EAS Update)
set -e

echo "🚀 Starting CheckInApp Deployment..."

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# 1️⃣ Ensure expo-cli and eas-cli are installed
echo "🔧 Checking expo-cli and eas-cli..."

if ! command -v expo &> /dev/null; then
  echo "📦 Installing expo-cli..."
  npm install -g expo-cli
else
  echo "✅ expo-cli is installed."
fi

if ! command -v eas &> /dev/null; then
  echo "📦 Installing eas-cli..."
  npm install -g eas-cli
else
  echo "✅ eas-cli is installed."
fi

# 2️⃣ Ensure logged in to Expo
echo "🔐 Logging into Expo account..."
eas whoami || eas login

# 3️⃣ Check and create package.json if missing
if [ ! -f "package.json" ]; then
  echo "📦 package.json not found — creating minimal package.json..."
  npm init -y
fi

# 4️⃣ Install core dependencies (safe to re-run)
echo "📦 Installing dependencies..."
npm install axios @react-native-community/datetimepicker

# 5️⃣ Initialize eas.json if missing
if [ ! -f "eas.json" ]; then
  echo "🛠 Creating eas.json..."
  cat <<EOF > eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {},
    "preview": {},
    "production": {}
  },
  "update": {
    "url": "https://u.expo.dev/21f67a57-176d-4931-a29a-497e9ddce786"
  }
}
EOF
else
  echo "✅ eas.json already exists."
fi

# 6️⃣ Confirm app.json includes update URL
PROJECT_ID="21f67a57-176d-4931-a29a-497e9ddce786"
UPDATE_URL="https://u.expo.dev/$PROJECT_ID"

if ! grep -q "$UPDATE_URL" app.json; then
  echo "⚠️ Please ensure your app.json includes:"
  echo "
  \"updates\": {
    \"url\": \"$UPDATE_URL\"
  },
  \"runtimeVersion\": {
    \"policy\": \"sdkVersion\"
  }"
  exit 1
else
  echo "✅ app.json contains correct update URL."
fi

# 7️⃣ Publish via EAS Update
echo "🚀 Publishing update to EAS..."
eas update --branch main --message "Automated QR update on $(date '+%Y-%m-%d %H:%M:%S')"

# 8️⃣ Generate QR code (optional)
PUBLIC_URL="https://expo.dev/updates/$PROJECT_ID"
echo "🔗 Your app is live at:"
echo "$PUBLIC_URL"

if command -v qrencode &> /dev/null; then
  echo "🖨 Generating QR code to qr.png..."
  qrencode -o qr.png "$PUBLIC_URL"
  echo "✅ QR code saved to qr.png"
else
  echo "ℹ️ Tip: install qrencode to auto-generate QR codes"
fi

echo "✅ CheckInApp Deployment Finished!"
