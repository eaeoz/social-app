# Automated Backup & Cleanup System Guide

## Overview

This system automatically backs up and deletes old messages to manage database storage efficiently.

## How It Works

### Two Collections Are Managed:

1. **`messages` Collection**
   - Contains actual message content (text, images, etc.)
   - Includes both public room messages and private messages
   - Uses `timestamp` field for date filtering
   - Example message structure:
   ```json
   {
     "_id": "...",
     "senderId": "...",
     "receiverId": "...",  // For private messages
     "roomId": "...",      // For public messages
     "content": "Message text here",
     "messageType": "text",
     "isPrivate": true/false,
     "timestamp": "2025-11-13T08:26:52.171Z"
   }
   ```

2. **`privatechats` Collection**
   - Contains private chat room metadata only
   - Stores participants, last message info, unread counts
   - Uses `createdAt` field for date filtering
   - Does NOT contain the actual messages
   - Example structure:
   ```json
   {
     "_id": "...",
     "participants": ["userId1", "userId2"],
     "lastMessageId": "...",
     "lastMessageAt": "2025-11-13T08:26:52.225Z",
     "isActive": true,
     "unreadCount": {},
     "createdAt": "2025-11-10T16:01:12.748Z"
   }
   ```

### Configuration Settings

Located in `siteSettings` collection:

- **`cleanCycle`**: 90 (days)
  - Messages older than this will be backed up and deleted
  
- **`cleanMinSize`**: 500 (MB)
  - Automatic cleanup triggers when database exceeds this size

### Backup Process

When cleanup runs (either manually or automatically):

1. **Backup Phase**:
   - Creates timestamped JSON files in `server/backups/` directory
   - `messages_YYYY-MM-DDTHH-mm-ss.json` - Contains all message content older than 90 days
   - `privatechats_YYYY-MM-DDTHH-mm-ss.json` - Contains chat room metadata older than 90 days

2. **Deletion Phase**:
   - Deletes backed-up messages from the database
   - Deletes backed-up chat room metadata
   - Frees up database storage space

3. **Result**:
   - Returns statistics (items backed up, items deleted, storage after)
   - Displays results in admin dashboard

## Manual Cleanup

### Via Admin Dashboard:

1. Navigate to **Cleanup** section in admin dashboard
2. Click "🧹 Manual Backup & Cleanup" button
3. Review the confirmation dialog showing:
   - How many days of messages will be cleaned (default: 90)
   - Where backups will be saved
4. Confirm to proceed

### Expected Results:

If no old messages exist (all messages are newer than 90 days):
```
✅ Cleanup completed successfully!
📦 Backed up:
  • 0 messages
  • 0 private chats
🗑️ Deleted: 0 total items
💾 Storage after cleanup: 0.39 MB
```

If old messages exist:
```
✅ Cleanup completed successfully!
📦 Backed up:
  • 150 messages → messages_2025-11-13T13-51-04-163Z.json
  • 8 private chats → privatechats_2025-11-13T13-51-04-163Z.json
🗑️ Deleted: 158 total items
💾 Storage after cleanup: 0.35 MB
```

## Automatic Cleanup

The system can automatically trigger cleanup when:
- Database storage exceeds `cleanMinSize` (500 MB by default)
- You can implement a cron job or scheduled task to check this periodically

## Backup File Location

All backups are saved to: `server/backups/`

Example files:
- `messages_2025-11-13T13-51-04-163Z.json`
- `privatechats_2025-11-13T13-51-04-163Z.json`

## Important Notes

1. **Messages vs Private Chats**:
   - The actual message content is in the `messages` collection
   - The `privatechats` collection only contains metadata about chat rooms
   - Both are backed up separately

2. **Why "0 messages" backed up?**:
   - This means all your messages are newer than 90 days
   - This is expected for new systems
   - Cleanup will run when messages become older

3. **Backup Files**:
   - Store these files in a safe location
   - They contain complete message history
   - Can be used to restore data if needed

4. **Storage Management**:
   - Check `server/backups/` directory regularly
   - Archive or move old backup files to external storage
   - Backup files themselves don't count toward the 500MB database threshold

## Testing

To test the backup system with a shorter timeframe (for testing only):

1. Temporarily change `cleanCycle` to a smaller value (e.g., 1 day)
2. Run manual cleanup
3. Check `server/backups/` for generated files
4. Restore `cleanCycle` to 90 days for production

## Restoring from Backup

To restore messages from a backup file:

1. Open the JSON backup file
2. Use MongoDB import tools or custom scripts
3. Insert documents back into the appropriate collection

## Monitoring

Check the Admin Dashboard Cleanup section to see:
- Current database storage usage
- Cleanup configuration settings
- Manual cleanup button for on-demand cleanup
