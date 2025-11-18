# User Sound Settings Implementation Guide

This document describes the implementation of personalized sound settings for users in the social app.

## Overview

Users can now customize their notification and call sounds independently from the admin panel's default settings. When a user registers, they receive the default sounds configured by the administrator, but they can change these settings at any time through their profile.

## Sound Settings Schema

Each user has a `sounds` object with 4 keys:

```javascript
sounds: {
  messageNotificationSound: 'stwime_up',  // Sound for incoming messages
  voiceCallSound: 'default',               // Sound for incoming voice calls
  videoCallSound: 'default',               // Sound for incoming video calls
  senderSound: 'pop'                       // Sound when user sends a message
}
```

## Implementation Details

### Backend

#### 1. Sound Routes (`server/routes/soundRoutes.js`)

Three endpoints have been created:

- **GET `/api/sounds/user-sounds`** - Get current user's sound settings
  - Requires authentication
  - Returns user's sound preferences or empty object if not set

- **PUT `/api/sounds/user-sounds`** - Update user's sound settings
  - Requires authentication
  - Accepts: `messageNotificationSound`, `voiceCallSound`, `videoCallSound`, `senderSound`
  - Updates only provided fields
  - Returns updated sound settings

- **GET `/api/sounds/available-sounds`** - Get available sound options
  - Requires authentication
  - Returns:
    - List of available sounds for each category
    - Default sounds from admin panel settings

#### 2. User Registration (`server/controllers/authController.js`)

When a user registers:
1. System fetches default sound settings from admin panel (`siteSettings` collection)
2. Creates user with default sounds:
   ```javascript
   sounds: {
     messageNotificationSound: siteSettings.messageNotificationSound || 'stwime_up',
     voiceCallSound: siteSettings.voiceCallSound || 'default',
     videoCallSound: siteSettings.videoCallSound || 'default',
     senderSound: siteSettings.senderNotificationSound || 'pop'
   }
   ```

#### 3. Server Registration (`server/server.js`)

The sound routes are registered in the main server file:
```javascript
import soundRoutes from './routes/soundRoutes.js';
app.use('/api/sounds', soundRoutes);
```

### Frontend (To Be Implemented)

The profile edit modal in `client/src/components/Home/Home.tsx` should include a sound settings section with:

1. **Four dropdown/select fields:**
   - Message Notification Sound
   - Voice Call Sound
   - Video Call Sound
   - Sender Sound (message sent confirmation)

2. **Available Options:**
   - Message Notifications: Stwime Up, Pop, Default, None
   - Call Sounds: Default, Classic, Modern, None
   - Sender Sounds: Pop, Swoosh, Ding, None

3. **Implementation Steps:**
   ```typescript
   // 1. Add state for sound settings
   const [soundSettings, setSoundSettings] = useState({
     messageNotificationSound: '',
     voiceCallSound: '',
     videoCallSound: '',
     senderSound: ''
   });

   // 2. Fetch user's current sounds on modal open
   useEffect(() => {
     if (showProfileModal) {
       fetchUserSounds();
     }
   }, [showProfileModal]);

   // 3. Update sounds when user saves profile
   const handleUpdateProfile = async () => {
     // ... existing profile update code ...
     
     // Update sound settings
     await fetch(`${API_URL}/sounds/user-sounds`, {
       method: 'PUT',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(soundSettings)
     });
   };
   ```

## Database Schema

### Users Collection

Each user document now includes:
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  // ... other user fields ...
  sounds: {
    messageNotificationSound: String,  // Default: 'stwime_up'
    voiceCallSound: String,            // Default: 'default'
    videoCallSound: String,            // Default: 'default'
    senderSound: String                // Default: 'pop'
  }
}
```

### Site Settings Collection

Admin panel controls the default sounds for new users:
```javascript
{
  settingType: 'global',
  messageNotificationSound: String,   // Admin's chosen default
  voiceCallSound: String,             // Admin's chosen default
  videoCallSound: String,             // Admin's chosen default
  senderNotificationSound: String,    // Admin's chosen default (maps to user's senderSound)
  // ... other settings ...
}
```

## Flow Diagram

```
User Registration
    ↓
Fetch Admin Default Sounds (siteSettings)
    ↓
Create User with Default Sounds
    ↓
User Can Login
    ↓
User Opens Profile Edit Modal
    ↓
User Changes Sound Preferences
    ↓
Save to Database (sounds object)
    ↓
User's Custom Sounds Applied
```

## API Examples

### Get User Sounds
```bash
GET /api/sounds/user-sounds
Authorization: Bearer <token>

Response:
{
  "success": true,
  "sounds": {
    "messageNotificationSound": "pop",
    "voiceCallSound": "classic",
    "videoCallSound": "modern",
    "senderSound": "swoosh"
  }
}
```

### Update User Sounds
```bash
PUT /api/sounds/user-sounds
Authorization: Bearer <token>
Content-Type: application/json

{
  "messageNotificationSound": "pop",
  "voiceCallSound": "classic"
}

Response:
{
  "success": true,
  "message": "Sound settings updated successfully",
  "sounds": {
    "messageNotificationSound": "pop",
    "voiceCallSound": "classic",
    "videoCallSound": "default",
    "senderSound": "pop"
  }
}
```

### Get Available Sounds
```bash
GET /api/sounds/available-sounds
Authorization: Bearer <token>

Response:
{
  "success": true,
  "availableSounds": {
    "messageNotificationSounds": [
      { "value": "stwime_up", "label": "Stwime Up (Default)" },
      { "value": "pop", "label": "Pop" },
      { "value": "default", "label": "Default" },
      { "value": "none", "label": "None" }
    ],
    "callSounds": [
      { "value": "default", "label": "Default" },
      { "value": "classic", "label": "Classic" },
      { "value": "modern", "label": "Modern" },
      { "value": "none", "label": "None" }
    ],
    "senderSounds": [
      { "value": "pop", "label": "Pop (Default)" },
      { "value": "swoosh", "label": "Swoosh" },
      { "value": "ding", "label": "Ding" },
      { "value": "none", "label": "None" }
    ]
  },
  "defaultSounds": {
    "messageNotificationSound": "stwime_up",
    "voiceCallSound": "default",
    "videoCallSound": "default",
    "senderSound": "pop"
  }
}
```

## Testing Checklist

- [ ] New users receive default sounds from admin panel
- [ ] Users can view their current sound settings
- [ ] Users can update individual sound settings
- [ ] Users can update all sound settings at once
- [ ] Sound settings persist across sessions
- [ ] Invalid sound values are rejected
- [ ] API requires authentication
- [ ] Frontend displays available sound options
- [ ] Frontend saves changes correctly
- [ ] Frontend shows success/error messages

## Future Enhancements

1. **Sound Preview**: Allow users to preview sounds before saving
2. **Custom Sounds**: Let users upload their own notification sounds
3. **Conditional Sounds**: Different sounds based on sender or time of day
4. **Sound Profiles**: Pre-configured sound sets (Silent, Professional, Fun, etc.)
5. **Per-Chat Sounds**: Different notification sounds for different chats

## Notes

- Sound files should be located in `client/public/sounds/`
- The actual sound playback logic is in `client/src/utils/notificationUtils.ts` and `client/src/utils/ringtoneUtils.ts`
- These utilities will need to be updated to read from user's sound preferences
- The `none` option will mute that particular notification type
