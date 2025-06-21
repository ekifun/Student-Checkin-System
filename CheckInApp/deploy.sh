#!/bin/bash

# Deployment script for CheckInApp (Expo + EAS Update)
set -e

echo "🚀 Starting CheckInApp Deployment..."

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

PROJECT_ID="21f67a57-176d-4931-a29a-497e9ddce786"
UPDATE_URL="https://u.expo.dev/$PROJECT_ID"

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

# 2️⃣ Login to Expo
echo "🔐 Logging into Expo account..."
eas whoami || eas login

# 3️⃣ Initialize package.json if missing
if [ ! -f "package.json" ]; then
  echo "📦 Creating package.json..."
  npm init -y
fi

# 4️⃣ Install core dependencies
echo "📦 Installing dependencies..."
npm install axios @react-native-community/datetimepicker

# 5️⃣ Ensure eas.json is valid
echo "🛠 Generating/Validating eas.json..."
cat <<EOF > eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {},
    "preview": {},
    "production": {}
  }
}
EOF
echo "✅ eas.json configured."

# 6️⃣ Update app.json if missing updates block
echo "🛠 Verifying app.json update config..."

if ! grep -q "\"updates\":" app.json; then
  echo "🔧 Inserting updates section into app.json..."
  tmp=$(mktemp)
  jq ".expo += {
    \"updates\": { \"url\": \"$UPDATE_URL\" },
    \"runtimeVersion\": { \"policy\": \"sdkVersion\" }
  }" app.json > "$tmp" && mv "$tmp" app.json
  echo "✅ app.json updated with updates config."
else
  echo "✅ app.json already includes updates config."
fi

# 7️⃣ Publish update
echo "🚀 Publishing latest JS bundle via EAS Update..."
eas update --branch main --message "Auto-publish on $(date '+%Y-%m-%d %H:%M:%S')"

# 8️⃣ Show and optionally generate QR code
PUBLIC_URL="https://expo.dev/updates/$PROJECT_ID"
echo "🔗 App update available at:"
echo "$PUBLIC_URL"

if command -v qrencode &> /dev/null; then
  echo "🖨 Generating QR code..."
  qrencode -o qr.png "$PUBLIC_URL"
  echo "✅ QR code saved to qr.png"
else
  echo "ℹ️ Tip: Install qrencode to generate QR codes in terminal"
fi

echo "✅ CheckInApp Deployment Finished!"
