# Site Settings Guide

## Overview

The `sitesettings` feature allows you to control whether profile pictures are displayed in the user search list. This is useful for privacy, performance, or bandwidth optimization.

## Database Collection

A new collection called `sitesettings` has been created in MongoDB with the following structure:

```javascript
{
  settingType: 'global',
  showuserlistpicture: 1,  // 1 = show pictures, 0 = hide pictures
  createdAt: Date,
  updatedAt: Date
}
```

## Default Behavior

- **Default value**: `showuserlistpicture: 1` (pictures are shown)
- The setting is automatically initialized when the server starts
- If the setting already exists, it won't be overwritten

## How It Works

### Backend (Server)

1. **Initialization**: When the server starts, it calls `initializeSiteSettings()` which creates the default settings if they don't exist.

2. **User List Endpoint**: The `/api/rooms/users` endpoint checks the setting and:
   - If `showuserlistpicture = 1`: Fetches profile picture data from Appwrite storage and includes URLs in the response
   - If `showuserlistpicture = 0`: Excludes profile picture data entirely, reducing database queries and network traffic

### Frontend (Client)

The frontend automatically adapts based on the backend response:
- When pictures are enabled, user avatars are displayed in the search modal
- When pictures are disabled, the avatar area is hidden and the layout adjusts accordingly

## API Endpoints

### Get Site Settings
```
GET /api/settings/site
```
Returns the current site settings (no authentication required).

**Response:**
```json
{
  "settings": {
    "showuserlistpicture": 1
  }
}
```

### Update Site Settings
```
PUT /api/settings/site
```
Updates the site settings (authentication required).

**Request Body:**
```json
{
  "showuserlistpicture": 0
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "showuserlistpicture": 0
  }
}
```

## How to Change the Setting

### Option 1: Using MongoDB Compass or MongoDB Shell

```javascript
db.sitesettings.updateOne(
  { settingType: 'global' },
  { $set: { showuserlistpicture: 0, updatedAt: new Date() } }
)
```

### Option 2: Using the API with curl

```bash
# Disable pictures
curl -X PUT http://localhost:4000/api/settings/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"showuserlistpicture": 0}'

# Enable pictures
curl -X PUT http://localhost:4000/api/settings/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"showuserlistpicture": 1}'
```

### Option 3: Using Postman or Similar Tools

1. Create a PUT request to `http://localhost:4000/api/settings/site`
2. Add Authorization header with your access token
3. Set Content-Type to `application/json`
4. Add body: `{"showuserlistpicture": 0}` or `{"showuserlistpicture": 1}`

## Benefits

### When Pictures are Hidden (showuserlistpicture: 0)

1. **Reduced Database Load**: No need to fetch `profilePictureId` field
2. **No Appwrite Storage Queries**: Saves API calls to generate picture URLs
3. **Faster Response Times**: Less data to process and transfer
4. **Bandwidth Savings**: No picture URLs or data transmitted
5. **Privacy**: User pictures are not exposed in search results

### When Pictures are Shown (showuserlistpicture: 1)

1. **Better User Experience**: Visual identification of users
2. **More Engaging Interface**: Profile pictures make the UI more personal
3. **Easier User Recognition**: Users can quickly identify contacts

## Files Modified

### Server-side
- `server/utils/initializeSiteSettings.js` - Settings management utilities
- `server/routes/settingsRoutes.js` - API endpoints for settings
- `server/routes/roomRoutes.js` - Modified to conditionally fetch pictures
- `server/server.js` - Initialization on startup

### Client-side
- `client/src/components/Home/Home.tsx` - Conditional rendering based on setting
- `client/src/components/Home/Home.css` - Styling for no-picture mode

## Testing

1. Start the server: `cd server && npm start`
2. Check console for: `✅ Site settings initialized with default values`
3. Open the user search modal in the app (Alt+M)
4. You should see profile pictures by default
5. Change the setting to `0` using one of the methods above
6. Refresh the page and open the search modal again
7. Pictures should now be hidden, and the layout adjusted

## Troubleshooting

### Pictures not showing after enabling

1. Clear browser cache
2. Ensure the setting is actually `1` in the database
3. Check that users have `profilePictureId` values
4. Verify Appwrite storage is accessible

### Setting not persisting

1. Check MongoDB connection
2. Verify the `sitesettings` collection exists
3. Check server logs for initialization messages

## Future Enhancements

Possible additions:
- Admin panel to toggle this setting via UI
- Per-user setting override
- Additional settings (e.g., show online status, show age, etc.)
- Setting presets (privacy mode, performance mode, etc.)
