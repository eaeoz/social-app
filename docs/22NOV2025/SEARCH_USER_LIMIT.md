# Search User Count Limit Feature

## Overview
Added a configurable limit for the number of users displayed in the search box. This feature is controlled via the `searchUserCount` field in the `sitesettings` collection.

## Database Changes

### sitesettings Collection
A new field has been added to the `sitesettings` collection:

```javascript
{
  settingType: 'global',
  showuserlistpicture: 1,
  searchUserCount: 50,  // NEW FIELD - Maximum number of users to show in search
  createdAt: Date,
  updatedAt: Date
}
```

**Default Value**: 50 users

## Implementation Details

### Backend Changes

1. **server/utils/initializeSiteSettings.js**
   - Updated `initializeSiteSettings()` to include `searchUserCount: 50` in default settings
   - Updated `getSiteSettings()` to return `searchUserCount` field (defaults to 50 if not set)
   - Updated error handling to include `searchUserCount` in default return values

2. **server/routes/roomRoutes.js**
   - Modified `/users` route to:
     - Fetch `searchUserCount` from site settings
     - Apply `.limit(searchUserCount)` to the user query
     - Limit the number of users returned in the search results

3. **server/utils/addSearchUserCount.js** (Migration Script)
   - Created migration script to add `searchUserCount` field to existing site settings
   - Script checks if field exists before adding to prevent duplicates
   - Successfully executed to update existing database

## How It Works

1. When users access the search/user list, the backend fetches the `searchUserCount` setting
2. The MongoDB query applies a `.limit()` based on this value
3. Only the specified number of users (default: 50) will be returned
4. Users are sorted by `displayName` before applying the limit

## Configuration

To change the user limit, you can:

1. **Update directly in MongoDB**:
   ```javascript
   db.sitesettings.updateOne(
     { settingType: 'global' },
     { $set: { searchUserCount: 100 } }  // Change to desired limit
   )
   ```

2. **Via the updateSiteSettings function** (if exposed in admin panel):
   ```javascript
   await updateSiteSettings({ searchUserCount: 100 });
   ```

## Benefits

- **Performance**: Limits the amount of data transferred and processed
- **User Experience**: Faster loading times for user search
- **Scalability**: Prevents overwhelming the UI with too many users
- **Configurable**: Can be adjusted based on needs without code changes

## Migration

The migration script has been successfully executed. If you need to run it again or on a new environment:

```bash
node server/utils/addSearchUserCount.js
```

## Notes

- The limit is applied AFTER sorting by displayName
- System user is automatically excluded from results
- Current user is automatically excluded from their own search results
- The default value of 50 provides a good balance between usability and performance
