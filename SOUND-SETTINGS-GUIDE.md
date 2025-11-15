# Sound Settings Implementation Guide

## Overview
This guide explains how the sound settings work in the social app, including database structure, file locations, and implementation details.

## Database Structure

### Collection: `siteSettings`
The sound settings are stored in the `siteSettings` collection with three new fields:

```javascript
{
  settingType: 'global',
  // ... other settings ...
  messageNotificationSound: 'default',  // Sound for new message notifications
  voiceCallSound: 'default',           // Sound for incoming voice calls
  videoCallSound: 'default',           // Sound for incoming video calls
  updatedAt: Date,
  createdAt: Date
}
```

### Available Sound Options

Each setting can be one of the following values:
- `'default'` - Default notification/ringtone sound
- `'gentle'` - Gentle chime (messages only)
- `'pop'` - Pop sound (messages only)
- `'ding'` - Ding sound (messages only)
- `'bell'` - Bell sound (messages only)
- `'swoosh'` - Swoosh sound (messages only)
- `'classic'` - Classic phone ring (calls only)
- `'modern'` - Modern tone (calls only)
- `'melody'` - Melody (calls only)
- `'chime'` - Chime (calls only)
- `'beep'` - Simple beep (calls only)
- `'none'` - Silent (no sound)

## File Structure

### Sound Files Location
All sound files should be placed in the **client-side** public directory:

```
client/public/sounds/
├── notifications/
│   ├── default.mp3
│   ├── gentle.mp3
│   ├── pop.mp3
│   ├── ding.mp3
│   ├── bell.mp3
│   └── swoosh.mp3
└── ringtones/
    ├── default.mp3
    ├── classic.mp3
    ├── modern.mp3
    ├── melody.mp3
    ├── chime.mp3
    └── beep.mp3
```

**Important:** Sound files are kept on the client side so:
1. Settings changes take effect immediately without redeployment
2. Sounds are loaded from the user's browser (faster)
3. Less server bandwidth usage

## Setup Instructions

### 1. Add Fields to Existing Database

If you have an existing database, run this command to add the sound settings fields:

```bash
node server/utils/addSoundSettings.js
```

This script will:
- Check if sound settings already exist
- Add the three new fields with default values
- Verify the update

### 2. Create Sound Files Directory

Create the directory structure in your client:

```bash
mkdir -p client/public/sounds/notifications
mkdir -p client/public/sounds/ringtones
```

### 3. Add Sound Files

Place your sound files (MP3 format recommended) in the appropriate directories:
- Message notification sounds → `client/public/sounds/notifications/`
- Call ringtones → `client/public/sounds/ringtones/`

**File naming must match the option values** (e.g., `default.mp3`, `gentle.mp3`, etc.)

### 4. Recommended Sound Specifications

For best user experience:
- **Format:** MP3 (widely supported)
- **Notification sounds:** 1-2 seconds duration
- **Ringtones:** 5-10 seconds duration (will loop)
- **Bitrate:** 128-192 kbps (good quality, small file size)
- **Volume:** Normalized to prevent startling users

## Admin Panel Usage

### Accessing Sound Settings

1. Log in to the Admin Panel
2. Navigate to **Settings**
3. Scroll to the **🔔 Sound Settings** section
4. Select preferred sounds from dropdowns
5. Click **💾 Save Changes**

### Settings Are Saved To:
- Database: `siteSettings` collection
- Fields: `messageNotificationSound`, `voiceCallSound`, `videoCallSound`

## Client Implementation (For Developers)

### Fetching Sound Settings

The client app should fetch sound settings from the API:

```javascript
// Fetch site settings
const response = await fetch(`${API_URL}/settings/site`);
const data = await response.json();

const {
  messageNotificationSound,
  voiceCallSound,
  videoCallSound
} = data.settings;
```

### Playing Sounds

Example implementation for playing notification sounds:

```javascript
// Create audio instance based on setting
const soundPath = `/sounds/notifications/${messageNotificationSound}.mp3`;
const audio = new Audio(soundPath);

// Play when message received
socket.on('new-message', () => {
  if (messageNotificationSound !== 'none') {
    audio.play().catch(err => console.error('Error playing sound:', err));
  }
});
```

Example for ringtones (with looping):

```javascript
// Create ringtone audio instance
const ringtonePath = `/sounds/ringtones/${voiceCallSound}.mp3`;
const ringtone = new Audio(ringtonePath);
ringtone.loop = true;

// Play when call incoming
socket.on('incoming-call', () => {
  if (voiceCallSound !== 'none') {
    ringtone.play().catch(err => console.error('Error playing ringtone:', err));
  }
});

// Stop when call ends
socket.on('call-ended', () => {
  ringtone.pause();
  ringtone.currentTime = 0;
});
```

## Technical Details

### Backend Implementation

#### Database Schema (`server/utils/initializeSiteSettings.js`)
```javascript
const defaultSettings = {
  // ... other settings ...
  messageNotificationSound: 'default',
  voiceCallSound: 'default',
  videoCallSound: 'default'
};
```

#### API Endpoint
- **GET** `/settings/site` - Returns all site settings including sound preferences
- **PUT** `/settings/site` - Updates site settings (admin only)

### Frontend Implementation

#### Admin Panel (`admin-client/src/components/Settings.tsx`)
- Three dropdown selects for sound customization
- Settings saved to database via PUT request
- Changes take effect immediately

## Benefits of This Approach

1. **Centralized Control:** Admins can change sounds for all users from one place
2. **Immediate Effect:** No app redeployment needed when sounds change
3. **User Experience:** Consistent sounds across all users
4. **Flexibility:** Easy to add new sound options
5. **Performance:** Sounds loaded from client's browser cache

## Troubleshooting

### Sounds Not Playing
- Check if sound files exist in `client/public/sounds/`
- Verify file names match the option values exactly
- Check browser console for errors
- Ensure audio playback is allowed (user interaction required)

### Settings Not Saving
- Verify admin authentication token is valid
- Check server logs for errors
- Run `node server/utils/addSoundSettings.js` to add fields

### Old Sounds Still Playing
- Clear browser cache
- Check that settings were actually saved to database
- Verify the client is fetching settings correctly

## Future Enhancements

Possible improvements:
- Allow users to upload custom sound files
- Add sound preview button in admin panel
- Per-user sound preferences
- Volume control settings
- Sound theme packs

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
