# User Display Limits Feature

## Overview
Two configurable limits have been added to control user display behavior in the application:

1. **defaultUsersDisplayCount**: Limits default user list (online users only)
2. **searchUserCount**: Limits search results (all users)

## Database Fields

### siteSettings Collection
The following fields have been added to the `sitesettings` collection:

```javascript
{
  settingType: 'global',
  showuserlistpicture: 0,
  searchUserCount: 50,              // NEW: Max users in search results
  defaultUsersDisplayCount: 20,     // NEW: Max users in default view
  createdAt: Date,
  updatedAt: Date
}
```

**Current Values:**
- `searchUserCount`: **50** (maximum users shown when searching)
- `defaultUsersDisplayCount`: **20** (maximum users shown by default)

## How It Works

### Default View (No Search)
When users open the user list **without entering a search term**:
- Shows **only online users** (status: 'online')
- Limited to **20 users maximum** (configurable via `defaultUsersDisplayCount`)
- Sorted by displayName

**API Call:**
```
GET /api/rooms/users
```

### Search View (With Search Input)
When users **enter a search term**:
- Shows **all users** (both online and offline)
- Searches username and displayName fields
- Limited to **50 users maximum** (configurable via `searchUserCount`)
- Sorted by displayName

**API Call:**
```
GET /api/rooms/users?search=searchTerm
```

## Implementation Details

### Backend Changes

1. **server/utils/initializeSiteSettings.js**
   - Added `defaultUsersDisplayCount: 20` to default settings
   - Updated `getSiteSettings()` to return both limit fields
   - Updated error handling to include both fields in defaults

2. **server/routes/roomRoutes.js - `/users` endpoint**
   - Added query parameter detection: `const { search } = req.query`
   - Implemented conditional logic:
     ```javascript
     const isSearching = search && search.trim().length > 0;
     
     // Filter by online status if not searching
     if (!isSearching) {
       filter.status = 'online';
     }
     
     // Add search filter if searching
     if (isSearching) {
       filter.$or = [
         { username: { $regex: search, $options: 'i' } },
         { displayName: { $regex: search, $options: 'i' } }
       ];
     }
     
     // Choose appropriate limit
     const limit = isSearching ? searchUserCount : defaultUsersDisplayCount;
     ```

3. **Migration Scripts**
   - `server/utils/addDefaultUsersDisplayCount.js` - Adds field to existing settings
   - Successfully executed to update database

## Current Database State

**Total Fields in siteSettings:** 7

1. _id (MongoDB ObjectId)
2. settingType: "global"
3. showuserlistpicture: 0
4. createdAt: Date
5. updatedAt: Date
6. **searchUserCount: 50** ✅
7. **defaultUsersDisplayCount: 20** ✅

## Configuration

### Change Default User Limit
To change the number of online users shown by default:

```javascript
db.sitesettings.updateOne(
  { settingType: 'global' },
  { $set: { defaultUsersDisplayCount: 30 } }  // Change to desired limit
)
```

### Change Search User Limit
To change the maximum users shown in search results:

```javascript
db.sitesettings.updateOne(
  { settingType: 'global' },
  { $set: { searchUserCount: 100 } }  // Change to desired limit
)
```

## Benefits

### Default View (Online Users Only)
- **Performance**: Reduces database queries and data transfer
- **User Experience**: Shows only relevant (online) users
- **Focus**: Users see who they can actually chat with right now
- **Scalability**: Prevents UI overload with large user bases

### Search View (All Users)
- **Flexibility**: Users can search for any user, online or offline
- **Controlled**: Limits prevent overwhelming search results
- **Efficient**: Regex search with appropriate limits

## Testing

### Test Default View
1. Open user list without typing anything
2. Only online users should appear
3. Maximum of 20 users displayed

### Test Search View
1. Type a search term in the user list
2. Both online and offline users matching the search appear
3. Maximum of 50 users displayed

### Verify Settings
Run verification script:
```bash
node server/utils/listSiteSettingsFields.js
```

## Frontend Integration

The frontend should:
1. Call `/api/rooms/users` for default view (no search parameter)
2. Call `/api/rooms/users?search=term` when user types in search box
3. Display "Only showing online users" message in default view
4. Display "Showing up to X results" in search view

## Notes

- Default view prioritizes showing **active/available users only**
- Search view allows finding **any user** regardless of status
- Both limits are independently configurable
- Changes take effect immediately without server restart
- MongoDB uses "fields" not "columns" - both fields exist as document properties
