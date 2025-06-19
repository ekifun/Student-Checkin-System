🎓 Student-Checkin-System

A complete mobile and backend system for managing student check-ins and check-outs, designed for teachers and administrators. This repository contains the backend service and a React Native mobile app.
🗂 Project Structure
Student-Checkin-System/
├── student-checkin-backend/      # Node.js + PostgreSQL backend
└── CheckInApp/                   # React Native frontend (via Expo)
⚙️ Backend Deployment
1. Deploy Backend Server
cd Student-Checkin-System/student-checkin-backend
sh deploy.sh
This will:
Install dependencies
Launch the backend server
Configure PostgreSQL and run migrations
📱 Run the Mobile App (iPhone)
1. Install Expo CLI
npm install -g expo-cli
2. Initialize the App
expo init CheckInApp
cd CheckInApp
Replace App.js with your version of the app code.
3. Install App Dependencies
npm install axios @react-native-community/datetimepicker
4. Start the App with Expo
expo start
Install Expo Go on your iPhone from the App Store
Scan the QR code shown in your terminal or browser to launch the app
🌍 Tunnel Mode for LAN Access
To expose the app over the internet (e.g., if your iPhone is on a different network):
npx expo start --tunnel
The QR code will start with exp://exp.host/...
Requires login with an Expo account inside Expo Go
🔁 Keep Expo Running (Optional)
To ensure Expo remains running in the background:
npm install -g pm2
pm2 start "npx expo start --tunnel" --name checkin-app
pm2 save
pm2 startup
🚀 Advanced Deployment: Fixed QR Code via EAS Update
Expo CLI has migrated to EAS Update, which provides a permanent QR code for your app. Here’s how to set it up:
1. Install EAS CLI
npm install -g eas-cli
2. Login to Expo
eas login
3. Initialize EAS Project
eas init
Choose the Managed workflow. This creates an eas.json file:
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
    "url": "https://u.expo.dev/YOUR_PROJECT_ID"
  }
}
4. Configure app.json or app.config.js
Make sure your app’s config includes:
{
  "expo": {
    "name": "RegistrationApp",
    "slug": "RegistrationApp",
    "runtimeVersion": {
      "policy": "sdkVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/21f67a57-176d-4931-a29a-497e9ddce786"
    }
  }
}
Replace the URL with your actual PROJECT_ID. You’ll find this in your Expo dashboard.
5. Publish the App
eas update --branch main --message "Initial public QR code release"
This returns a permanent shareable link, e.g.:
https://expo.dev/updates/21f67a57-176d-4931-a29a-497e9ddce786
6. Generate a QR Code (Optional)
Use a free QR code generator, or:
qrencode -o qr.png "https://expo.dev/updates/21f67a57-176d-4931-a29a-497e9ddce786"
7. Scan in Expo Go
Open Expo Go on your iPhone
Scan the generated QR code
Your app loads directly with the fixed public link
✅ Summary
Task	Tool	Result
Start local app	expo start	Temporary QR for local dev
Share over internet	--tunnel	Temporary public QR
Publish with permanent QR	eas update	Fixed QR for long-term sharing