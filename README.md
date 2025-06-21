# 🎓 Student-Checkin-System

A complete mobile and backend system for managing student check‑ins and check‑outs, designed for teachers and administrators. This repository contains:

- 📦 `student-checkin-backend/`: Node.js + PostgreSQL backend service  
- 📱 `CheckInApp/`: React Native frontend app built with Expo  

---

## 🗂 Project Structure

Student-Checkin-System/
├── student-checkin-backend/ # Backend (Node.js + PostgreSQL)
└── CheckInApp/ # Frontend (Expo + React Native)


---

## ⚙️ Backend Deployment

Step 1: Deploy Backend Server
```bash
cd student-checkin-backend
sh deploy.sh
```

This will:
Install dependencies
Launch the backend server
Configure PostgreSQL and run migrations

## 📱 Run the Mobile App (iPhone)

Step 1: Install Expo CLI
```bash
npm install -g expo-cli
```

Step 2: Initialize the App
```bash
expo init CheckInApp
cd CheckInApp
```
Replace App.js with your provided version of the app code.


Step 3: Install Dependencies
```bash
npm install axios @react-native-community/datetimepicker
```

Step 4: Start the App with Expo
```bash
expo start
```

Then:
Install Expo Go from the App Store on your iPhone
Scan the QR code in the terminal or browser to launch the app

🌍 Tunnel Mode for LAN Access
To make your local app reachable from other networks:
```bash
npx expo start --tunnel
```
QR code begins with exp://exp.host/...
Requires login within Expo Go

🔁 Keep Expo Running in Background (Optional)
```bash
npm install -g pm2
pm2 start "npx expo start --tunnel" --name checkin-app
pm2 save
pm2 startup
```

🚀 Advanced Deployment: Fixed QR Code via EAS Update
Expo CLI now uses EAS Update to generate a permanent public QR code.

Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

Step 2: Login to Expo
```bash
eas login
```

Step 3: Initialize EAS Project
```bash
eas init
```
Choose Managed when prompted. This creates eas.json:
```bash
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "development": {},
    "preview": {},
    "production": {}
  },
  "update": {
    "url": "https://u.expo.dev/YOUR_PROJECT_ID"
  }
}
```

Step 4: Add Update Config in App Config
In app.json or app.config.js:
```bash
{
  "expo": {
    "name": "RegistrationApp",
    "slug": "RegistrationApp",
    "runtimeVersion": { "policy": "sdkVersion" },
    "updates": {
      "url": "https://u.expo.dev/21f67a57-176d-4931-a29a-497e9ddce786"
    }
  }
}
```
Replace the URL with your real project ID from your Expo dashboard.

Step 5: Publish with EAS Update
```bash
eas update --branch main --message "Initial public QR code release"
```
You'll get a shareable link, e.g.:
https://expo.dev/updates/21f67a57-176d-4931-a29a-497e9ddce786

Step 6: (Optional) Generate a QR Code
qrencode -o qr.png "https://expo.dev/updates/21f67a57-176d-4931-a29a-497e9ddce786"

Step 7: Scan in Expo Go
Open Expo Go on your mobile device
Scan the QR code
Your app will load directly from the fixed QR link 🎉

✅ Summary
Task	Command/Tool	Result
Start local app	expo start	Temporary QR for local development
Share over internet	npx expo start --tunnel	Temporary public QR
Publish with fixed QR	eas update	Stable QR for public distribution


🚀 Deployment guide for Kubernetes manifests
https://docs.google.com/document/d/1-6doPPlfsS5uo5E0WcdUmzp4KGoXXDSiMCURUboqAD0/edit?usp=sharing
// trigger test
