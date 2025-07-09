# Firebase Setup for Taberinos Game

## 🔥 Firebase Project Setup Instructions

To enable the global leaderboard, you need to set up a Firebase project:

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "taberinos-game" (or any name you prefer)
4. Complete the setup wizard

### Step 2: Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location close to your users

### Step 3: Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app (</>) 
4. Register your app with name "Taberinos"
5. Copy the `firebaseConfig` object

### Step 4: Update Configuration
Replace the placeholder config in `js/Leaderboard.js` (lines 7-14) with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "your-app-id"
};
```

### Step 5: Configure Firestore Security Rules
Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to leaderboard for everyone
    match /leaderboard/{document} {
      allow read: if true;
      // Allow write if the document is small and has required fields
      allow write: if request.auth == null 
        && resource == null
        && request.resource.data.keys().hasAll(['playerName', 'level', 'shotsUsed', 'date', 'timestamp'])
        && request.resource.data.playerName is string
        && request.resource.data.level is number
        && request.resource.data.shotsUsed is number
        && request.resource.data.level > 0
        && request.resource.data.shotsUsed > 0;
    }
  }
}
```

### Step 6: Change Admin Password
Update the admin password in `js/Leaderboard.js` line 148:
```javascript
const correctPassword = 'your-secure-admin-password';
```

## 🎯 Features
- **Global Leaderboard**: Real-time scores across all devices
- **Local Leaderboard**: Personal progress tracking
- **Player Names**: Players enter their name for global scores
- **Password Protected**: Admin password required to clear global scores
- **Fallback**: Works offline with local scores if Firebase is unavailable

## 🔒 Security Notes
- Test mode allows anyone to read/write - fine for a game leaderboard
- Production rules limit write operations to valid score format
- Admin password protects global leaderboard clearing
- No authentication required for submitting scores (keeps it simple)

## 🚀 Deployment
Once configured, your game will automatically:
1. Save scores locally and globally
2. Show both personal and global leaderboards
3. Work offline (local scores only)
4. Allow global competition between players
