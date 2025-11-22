# Sender Notification Sounds Setup Guide

## Overview
This guide explains how to add sender notification sound files to complete the implementation.

## What Was Implemented

1. **Database Field**: Added `senderNotificationSound` field to site settings (default: 'pop')
2. **Admin Panel**: Added "Sender Notification Sound" dropdown in Settings with these options:
   - Pop (Default)
   - Click
   - Swoosh
   - Ding
   - Tap
   - None (Silent)

3. **Client Code**: Updated `notificationUtils.ts` to:
   - Fetch `senderNotificationSound` from database
   - Load sounds from `/sounds/sender/` directory
   - Play sender-specific sound when user sends a message

## Sound Files Needed

You need to create/download these MP3 files and place them in `client/public/sounds/sender/`:

1. **pop.mp3** - Default confirmation sound (short, subtle pop)
2. **click.mp3** - Quick click sound
3. **swoosh.mp3** - Swift whoosh/send sound
4. **ding.mp3** - Light ding/bell sound
5. **tap.mp3** - Soft tap/button press sound

## Directory Structure

```
client/public/sounds/
├── notifications/          # Receiver sounds (already exists)
│   ├── stwime_up.mp3
│   ├── alixtwix.mp3
│   ├── bright-bell.mp3
│   ├── chime.mp3
│   ├── formula.mp3
│   └── iphone.mp3
├── ringtones/             # Call sounds (already exists)
│   ├── default.mp3
│   ├── ringtone1.mp3
│   ├── ringtone2.mp3
│   ├── ringtone3.mp3
│   ├── ringtone4.mp3
│   └── ringtone5.mp3
└── sender/                # NEW - Sender confirmation sounds
    ├── pop.mp3           # ⚠️ REQUIRED
    ├── click.mp3         # ⚠️ REQUIRED
    ├── swoosh.mp3        # ⚠️ REQUIRED
    ├── ding.mp3          # ⚠️ REQUIRED
    └── tap.mp3           # ⚠️ REQUIRED
```

## Where to Get Sound Files

### Option 1: Free Sound Libraries
- **Freesound.org** - https://freesound.org/ (requires free account)
  - Search for: "pop", "click", "swoosh", "ding", "tap"
  - Filter: License = Creative Commons 0 (CC0) or CC BY
  - Download as MP3 or convert to MP3

- **Zapsplat.com** - https://www.zapsplat.com/ (free with attribution)
  - Search UI sound effects
  - Look for short, subtle notification sounds

- **Mixkit.co** - https://mixkit.co/free-sound-effects/
  - Free license for commercial use
  - Browse UI/notification sounds

### Option 2: Generate Simple Sounds
For very simple sounds, you can use online tone generators:
- https://onlinetonegenerator.com/
- Set duration to 50-200ms
- Export as MP3

### Option 3: Use Existing Notification Sounds as Templates
You can duplicate and modify existing notification sounds from the `notifications/` folder:
```bash
# Example: Use iphone.mp3 as basis for pop.mp3
copy client\public\sounds\notifications\iphone.mp3 client\public\sounds\sender\pop.mp3
```

## Sound Characteristics for Sender Sounds

Sender confirmation sounds should be:
- **Very short**: 50-300ms duration
- **Subtle**: Lower volume, not attention-grabbing
- **Pleasant**: Positive confirmation feeling
- **Distinct**: Different from receiver notification sounds

## Testing After Adding Files

1. Add the 5 MP3 files to `client/public/sounds/sender/`
2. Restart the development server if needed
3. Log in as admin and go to Settings
4. Change "Sender Notification Sound" to different options
5. Save settings
6. As a regular user, send a message - you should hear the selected sound
7. Verify sounds change when admin updates the setting (refreshes every 30 seconds)

## Current Implementation Status

✅ Database field added
✅ Admin UI updated
✅ Client code updated to fetch and use sender sounds
✅ `/sounds/sender/` directory created
⚠️ **PENDING**: MP3 sound files need to be added to `/client/public/sounds/sender/`

## How It Works

1. **Admin configures**: Admin selects sender sound in Settings panel
2. **Database stores**: Setting saved as `senderNotificationSound` in MongoDB
3. **Client fetches**: On load and every 30s, client fetches sound setting
4. **User sends message**: `playSendMessageSound()` is called
5. **Sound plays**: Loads `/sounds/sender/{setting}.mp3` and plays it
6. **DND respected**: No sound if user has Do Not Disturb enabled

## Benefits

- **Clear feedback**: Users know their message was sent
- **Customizable**: Admin can change the sound site-wide
- **Respects DND**: Won't play if user has notifications disabled
- **Separate from receiver**: Different sound when receiving vs sending
- **Database-driven**: No code changes needed to update sounds
