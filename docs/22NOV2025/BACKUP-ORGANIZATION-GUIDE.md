# Backup Organization Guide

This guide explains how to organize and manage your chat backups.

## Overview

The backup system now includes tools to:
1. **Reorganize backups** into a user-friendly folder structure
2. **Clean up organized backups** when no longer needed

## Scripts Available

### 1. Reorganize Backups

**File:** `server/utils/reorganizeBackupsSimple.js`

Converts flat backup JSON files into organized folder structures:
- **Private chats**: Organized by user ID pairs
- **Public rooms**: Organized by room IDs

#### Usage:
```bash
cd server
node utils/reorganizeBackupsSimple.js
```

#### What it does:
- Reads all `messages_*.json` files in `server/backups/`
- Creates organized folders named `organized_[timestamp]/`
- Separates messages into:
  - `private_chats/` - Each conversation in its own folder
  - `public_rooms/` - Each room in its own folder
- Each folder contains:
  - `messages.json` - All messages sorted by timestamp
  - `info.txt` - Human-readable summary

#### Example Output Structure:
```
server/backups/
├── messages_2025-11-13T15-37-00-311Z.json (original backup)
└── organized_2025-11-13T15-37-00-311Z/
    ├── private_chats/
    │   ├── user_[ID1]_and_user_[ID2]/
    │   │   ├── messages.json
    │   │   └── info.txt
    │   └── user_[ID3]_and_user_[ID4]/
    │       ├── messages.json
    │       └── info.txt
    └── public_rooms/
        ├── room_[ROOM_ID]/
        │   ├── messages.json
        │   └── info.txt
        └── room_[ROOM_ID2]/
            ├── messages.json
            └── info.txt
```

---

### 2. Clean Organized Backups

**File:** `server/utils/cleanOrganizedBackups.js`

Deletes all organized backup folders while preserving original JSON files.

#### Usage:

**List organized backups (without deleting):**
```bash
cd server
node utils/cleanOrganizedBackups.js list
```

**Clean all organized backups:**
```bash
cd server
node utils/cleanOrganizedBackups.js clean
```

Or simply:
```bash
cd server
node utils/cleanOrganizedBackups.js
```

#### What it does:
- Finds all folders starting with `organized_`
- Shows folder statistics (file count, size)
- Deletes the organized folders
- **Preserves** original backup JSON files

#### Example Output:
```
🧹 Starting cleanup of organized backup folders...
📁 Backup directory: E:\Gemini\social-app\server\backups

Found 2 organized backup folder(s) to delete:

🗑️ Deleting: organized_2025-11-13T16-23-00-308Z
   Files: 6, Size: 0.00 MB
   ✅ Deleted successfully

🗑️ Deleting: organized_2025-11-13T16-24-00-317Z
   Files: 8, Size: 0.00 MB
   ✅ Deleted successfully

=== Cleanup Complete ===
✅ Successfully deleted 2 organized backup folder(s)
📋 Original backup JSON files have been preserved
```

---

## Workflow

### Typical Usage:

1. **When you want to browse backups:**
   ```bash
   cd server
   node utils/reorganizeBackupsSimple.js
   ```
   This creates organized folders you can easily browse.

2. **Browse the organized folders:**
   Navigate to `server/backups/organized_[timestamp]/` to view messages by conversation or room.

3. **When done browsing, clean up:**
   ```bash
   cd server
   node utils/cleanOrganizedBackups.js
   ```
   This removes the organized folders to save space, while keeping original backups.

---

## Advanced Version

**File:** `server/utils/reorganizeBackups.js`

This version connects to MongoDB to use actual usernames and room names instead of IDs.

#### Requirements:
- MongoDB connection must be available
- Proper `MONGODB_URI` environment variable

#### Usage:
```bash
cd server
node utils/reorganizeBackups.js
```

#### Differences from Simple Version:
- Folder names use actual usernames: `john_and_mary/` instead of `user_[ID]_and_user_[ID]/`
- Room folders use actual names: `general_chat/` instead of `room_[ID]/`

---

## Safety Features

✅ **Original backups are never deleted** - Only organized folders are removed  
✅ **Confirmation before deletion** - The script shows what will be deleted  
✅ **Statistics provided** - File count and size before deletion  
✅ **Error handling** - Individual folder deletion failures won't stop the entire process

---

## Tips

- **Storage**: Organized folders take up minimal additional space (usually < 1 MB)
- **Frequency**: Reorganize backups only when you need to browse them
- **Cleanup**: Clean up regularly if you reorganize often
- **Original backups**: The system's automatic cleanup handles original JSON files separately

---

## Troubleshooting

### "No organized backup folders found"
This means there are no folders to clean up. Run the reorganize script first if you want to create organized folders.

### MongoDB connection errors (advanced version)
If `reorganizeBackups.js` fails to connect to MongoDB, use `reorganizeBackupsSimple.js` instead, which works without a database connection.

### Permissions errors
Ensure you have write permissions in the `server/backups/` directory.

---

## Related Files

- `server/utils/backupAndCleanup.js` - Automatic backup and cleanup system
- `BACKUP-CLEANUP-GUIDE.md` - Guide for the automatic cleanup system
