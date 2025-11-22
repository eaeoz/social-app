# OpenChats Array Cleanup Solution

## Problem Identified

The `openChats` array in user profiles was growing indefinitely, causing database bloat:

- Every time a user chats with someone, an entry is added to their `openChats` array
- When users close chats (state=false), entries remain in the database
- Users chatting with many people accumulate large arrays
- These arrays never get cleaned up, increasing database size over time

### Example from Database:
```javascript
{
  _id: ObjectId("691397c9e0fd1846a1e5788e"),
  username: "smoggytomb272",
  openChats: [
    { userId: "6911f671be2c55e447204507", state: false },
    { userId: "6913a1f8e0fd1846a1e57890", state: false },
    { userId: "6913b2a9e0fd1846a1e57891", state: true },
    { userId: "6913c3bae0fd1846a1e57892", state: false },
    { userId: "6913d4cbe0fd1846a1e57893", state: false }
    // ... potentially many more entries
  ]
}
```

## Solution Implemented

### 1. Automated Cleanup Script (`server/customSchedules/cleanupOpenChats.js`)

A scheduled cleanup script that:

- Runs periodically (configurable via admin panel)
- Processes all users with `openChats` arrays
- Removes closed chat entries (state=false) when no recent messages exist
- Respects the message retention period setting
- Provides detailed logging and statistics

**Logic:**
- For each user with an `openChats` array
- Check each entry where `state === false`
- Count messages between users within retention period
- If message count = 0, remove the entry completely
- Update user document with cleaned array and timestamp

**Benefits:**
- Prevents long-term database bloat
- Respects message retention settings
- Runs automatically without manual intervention
- Provides statistics for monitoring

### 2. Immediate Cleanup on Chat Close (`server/routes/roomRoutes.js`)

Enhanced the `/close-private-chat` endpoint to:

- Check for recent messages when closing a chat
- If no messages exist within retention period, remove entry immediately
- If messages exist, set state to false (preserving for later cleanup)
- Add `openChatsUpdatedAt` timestamp for tracking

**Logic:**
```javascript
// When user closes a chat:
1. Check message count within retention period
2. If messageCount === 0:
   - Remove entry from openChats immediately
3. Else:
   - Set state: false (will be cleaned up later)
4. Update user document with timestamp
```

**Benefits:**
- Immediate cleanup when possible
- Reduces database operations
- User-initiated cleanup
- Prevents unnecessary array growth

### 3. Timestamp Tracking

Added `openChatsUpdatedAt` field to track when the array was last modified:

```javascript
{
  openChats: [...],
  openChatsUpdatedAt: ISODate("2025-11-19T00:00:00.000Z")
}
```

**Benefits:**
- Audit trail for debugging
- Monitor cleanup frequency
- Identify stale data

## How to Use

### Setting Up Automated Cleanup

1. **Access Admin Panel** → Navigate to Custom Schedules
2. **Create New Schedule:**
   - Name: "OpenChats Array Cleanup"
   - Script Path: `cleanupOpenChats.js`
   - Schedule: Choose frequency (recommended: `every_day` or `every_12_hours`)
   - Active: ✓ Enabled

3. **Monitor Results:**
   - Check server logs for cleanup statistics
   - View schedule execution history in admin panel

### Manual Testing

To test the cleanup script manually, you have two options:

**Option 1: Using the test script (recommended)**
```bash
# From project root
cd server
node customSchedules/test-cleanup.js
```

**Option 2: Using Node.js import**
```bash
# From server directory
node -e "import('./customSchedules/cleanupOpenChats.js').then(m => m.execute())"
```

**Option 3: From project root**
```bash
# Must be in server directory first
cd server
node customSchedules/test-cleanup.js
```

### Configuration

The cleanup respects the `messageRetentionDays` setting from Site Settings:

- **0 days**: Messages deleted immediately on close, entries removed
- **1 day** (default): Entries kept for 1 day after last message
- **7 days**: Entries kept for 1 week after last message
- **90 days**: Entries kept for 3 months after last message

## Technical Details

### Files Modified

1. **server/customSchedules/cleanupOpenChats.js** (NEW)
   - Automated cleanup script
   - Processes all users
   - Removes stale entries

2. **server/routes/roomRoutes.js** (MODIFIED)
   - Enhanced `/close-private-chat` endpoint
   - Immediate cleanup when no messages
   - Added timestamp tracking

### Database Impact

**Before:**
```javascript
openChats: [
  { userId: "user1", state: false }, // No messages, should be removed
  { userId: "user2", state: false }, // No messages, should be removed
  { userId: "user3", state: false }, // No messages, should be removed
  { userId: "user4", state: true },
  { userId: "user5", state: false }  // No messages, should be removed
]
```

**After Cleanup:**
```javascript
openChats: [
  { userId: "user4", state: true }
],
openChatsUpdatedAt: ISODate("2025-11-19T02:50:00.000Z")
```

### Performance Considerations

- Cleanup runs in background (scheduled task)
- Processes users in batches
- Uses indexed queries (MongoDB ObjectId indexes)
- Minimal impact on active users
- Logarithmic time complexity O(n log n)

### Logging

The script provides detailed logs:

```
🧹 [OpenChats Cleanup] Starting cleanup at: 2025-11-19T02:50:00.000Z
📊 [OpenChats Cleanup] Processing 150 users
  🗑️ Removing closed chat entry for user 691397c9... with 6911f671... (no recent messages)
  ✅ User 691397c9...: Removed 4 entries (5 → 1)
✅ [OpenChats Cleanup] Completed successfully
📊 Statistics: {
  usersProcessed: 150,
  usersUpdated: 45,
  entriesRemoved: 180
}
```

## Expected Results

### Database Size Reduction

For a system with:
- 1,000 active users
- Average 10 chat entries per user
- 50% closed chats with no messages

**Before:** ~10,000 entries in openChats arrays  
**After:** ~5,000 entries (50% reduction)

### Ongoing Maintenance

With regular cleanup:
- openChats arrays stay lean
- Database queries remain fast
- Storage costs reduced
- Better overall performance

## Monitoring

### Health Checks

1. **Check array sizes:**
```javascript
db.users.aggregate([
  { $project: { 
    username: 1, 
    arraySize: { $size: { $ifNull: ["$openChats", []] } }
  }},
  { $sort: { arraySize: -1 } },
  { $limit: 10 }
])
```

2. **Check last cleanup:**
```javascript
db.users.find(
  { openChatsUpdatedAt: { $exists: true } },
  { username: 1, openChatsUpdatedAt: 1 }
).sort({ openChatsUpdatedAt: -1 }).limit(5)
```

3. **Monitor cleanup schedule:**
- Admin Panel → Custom Schedules
- Check "Last Run" and "Next Run" times
- Review execution results

## Troubleshooting

### Script Not Running

1. Check if schedule is active in admin panel
2. Verify cron task is running: Check server logs for schedule initialization
3. Check for errors in server console

### Entries Not Being Removed

1. Verify messages are actually deleted (check retention settings)
2. Check if entries have `state: false`
3. Ensure retention period has passed

### Performance Issues

1. Reduce cleanup frequency (e.g., from every_hour to every_day)
2. Check database indexes on users collection
3. Monitor server resources during cleanup

## Migration Notes

For existing systems with large openChats arrays:

1. **First Run**: May take longer to process all users
2. **Expect**: Significant database size reduction
3. **Monitor**: Server logs during first execution
4. **Recommended**: Run during low-traffic hours initially

## Future Enhancements

Possible improvements:

1. Add maximum array size limit (e.g., 50 entries)
2. Implement array size monitoring alerts
3. Add cleanup metrics to admin dashboard
4. Create user-facing "clear all closed chats" button

## Summary

This solution effectively addresses the openChats array bloat issue by:

✅ Automatically removing stale entries  
✅ Respecting message retention policies  
✅ Providing immediate cleanup when possible  
✅ Tracking cleanup operations with timestamps  
✅ Offering flexible scheduling options  
✅ Maintaining detailed logs for monitoring  

The implementation is production-ready, well-tested, and designed for minimal performance impact.
