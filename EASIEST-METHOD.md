# EASIEST Method - Create Collections via MongoDB Atlas Website

No software download needed! Do everything in your browser.

## Step-by-Step Instructions:

### 1. Go to MongoDB Atlas Website
- Open your browser
- Go to: https://cloud.mongodb.com/
- Log in with your MongoDB account

### 2. Navigate to Your Database
- You'll see your clusters
- Click on your cluster name
- Click the **"Browse Collections"** button

### 3. Create Database (if not exists)
- Click **"Add My Own Data"** or **"Create Database"**
- Database Name: **social-app**
- Collection Name: **users**
- Click **"Create"**

### 4. Create Remaining Collections

For each collection below, click **"Create Collection"** button and enter the name:

1. ✅ users (already created)
2. userpresence
3. publicrooms
4. messages
5. privatechats
6. banners
7. passwordresets
8. settings
9. typing
10. notifications

### 5. Create Indexes

#### For "users" collection:
1. Click on **"users"** collection
2. Click **"Indexes"** tab
3. Click **"Create Index"** button
4. In the field, type: `{ "username": 1 }`
5. Check the **"Create unique index"** checkbox
6. Click **"Review"** then **"Confirm"**
7. Repeat for email:
   - Click **"Create Index"**
   - Type: `{ "email": 1 }`
   - Check **"Create unique index"**
   - Confirm

#### For "userpresence" collection:
1. Click on **"userpresence"**
2. Click **"Indexes"** tab
3. Create index: `{ "userId": 1 }` - mark as unique
4. Create index: `{ "isOnline": 1 }` - not unique

#### For "publicrooms" collection:
1. Click on **"publicrooms"**
2. Create index: `{ "name": 1 }`
3. Create index: `{ "isActive": 1 }`

#### For "messages" collection:
1. Click on **"messages"**
2. Create index: `{ "senderId": 1 }`
3. Create index: `{ "receiverId": 1 }`
4. Create index: `{ "roomId": 1 }`
5. Create index: `{ "timestamp": -1 }`

#### For "privatechats" collection:
1. Click on **"privatechats"**
2. Create index: `{ "participants": 1 }`

#### For "banners" collection:
1. Click on **"banners"**
2. Create index: `{ "active": 1 }`
3. Create index: `{ "displayOrder": 1 }`

#### For "passwordresets" collection:
1. Click on **"passwordresets"**
2. Create index: `{ "userId": 1 }`
3. Create index: `{ "token": 1 }` - mark as unique

#### For "settings" collection:
1. Click on **"settings"**
2. Create index: `{ "userId": 1 }` - mark as unique

#### For "typing" collection:
1. Click on **"typing"**
2. Create compound index: `{ "targetId": 1, "targetType": 1 }`

#### For "notifications" collection:
1. Click on **"notifications"**
2. Create compound index: `{ "userId": 1, "isRead": 1 }`
3. Create index: `{ "createdAt": -1 }`

---

## Alternative: Use MongoDB Compass (If you want to try again)

### Finding MongoSH in Compass:

**If you have an OLDER version of Compass:**
- MongoSH might not be available
- Update to latest version: https://www.mongodb.com/try/download/compass

**In NEWER versions of Compass (1.35+):**
1. Connect to your database
2. Look at the **very bottom** of the window
3. You should see tabs like: "Databases", "Performance", and **">_MONGOSH"**
4. If you don't see it, try clicking the hamburger menu (≡) at top left → "Shell"

**Alternative in Compass - Without MongoSH:**
1. Right-click on "social-app" database in left sidebar
2. Select "Create Collection"
3. Enter collection name
4. Repeat for all 10 collections

---

## Even Simpler: Manual Creation in VS Code

Since you have VS Code with MongoDB extension:

1. **Open VS Code**
2. **Click MongoDB icon** in left sidebar
3. **Find your "social-app" database**
4. **Right-click on it**
5. **Select "Add Collection"**
6. **Type collection name**: users
7. **Repeat 9 more times** for other collections

Then for indexes:
1. **Right-click on "users" collection**
2. **Select "Add Index"**
3. **Type**: `{ "username": 1 }`
4. **Check "unique"**
5. **Click Create**

---

## Quick Test - Just Create One Collection First

Let's test if your connection works:

### In MongoDB Atlas Website:
1. Go to Browse Collections
2. Click "Create Collection"
3. Name it: **test**
4. Click Create
5. If this works, you can create the other 10 collections the same way!

---

## Need Help?

If you're still stuck, tell me:
1. Are you using MongoDB Compass or Atlas website?
2. Can you see your database name in the interface?
3. Can you see a list of collections (even if empty)?

I'll help you with more specific instructions based on what you see!
