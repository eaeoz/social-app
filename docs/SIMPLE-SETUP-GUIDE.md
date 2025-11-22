# Simple MongoDB Setup - Choose Your Method

## ✅ EASIEST: Use MongoDB Compass (Recommended)

**This method is guaranteed to work!**

### Steps:

1. **Download MongoDB Compass** (if you don't have it):
   - Go to: https://www.mongodb.com/try/download/compass
   - Download and install (it's free)

2. **Open MongoDB Compass**

3. **Connect to your database**:
   - Click "New Connection"
   - Paste your connection string (from `.env` file):
     ```
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
     ```
   - Click "Connect"

4. **Open MongoSH (Shell)**:
   - Look at the bottom of Compass window
   - Click the **">_MONGOSH"** tab

5. **Copy and paste this entire script**:
   - Open the file `setup-mongodb.js`
   - Copy ALL the content (Ctrl+A, Ctrl+C)
   - Paste into MongoSH tab in Compass
   - Press **Enter**

6. **Done!** ✅
   - You'll see success messages
   - Refresh the left sidebar
   - All 10 collections will appear under "social-app" database

---

## 🔧 Alternative: VS Code MongoDB Extension

### Step 1: Install Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search: "MongoDB for VS Code"
4. Install it

### Step 2: Connect
1. Click MongoDB icon in left sidebar
2. Click "Add Connection"
3. Paste your connection string
4. Click "Connect"

### Step 3: Run Commands Manually

Since the playground might not have the right commands, let's create collections manually:

1. In MongoDB sidebar, right-click on "social-app" database
2. Select "Add Collection"
3. Enter collection name: **users**
4. Click Create

Repeat for all 10 collections:
- users
- userpresence
- publicrooms
- messages
- privatechats
- banners
- passwordresets
- settings
- typing
- notifications

### Step 4: Create Indexes

For each collection, right-click → "Add Index" → Enter index definition:

**For users:**
```json
{ "username": 1 }
```
Check "unique" checkbox, then create.

Repeat with:
```json
{ "email": 1 }
```
Check "unique" checkbox, then create.

**For other collections**, see the list in `VS-CODE-MONGODB-GUIDE.md`

---

## 🌐 Alternative: MongoDB Atlas Web Interface

### Steps:

1. Go to https://cloud.mongodb.com/
2. Log in to your account
3. Click on your cluster → "Browse Collections"
4. Click "Add My Own Data"
5. Database name: **social-app**
6. Create each collection manually:

**Collection 1: users**
- Click "Create Collection"
- Name: users
- After creating, click on it → "Indexes" tab → "Create Index"
- Index: `{ "username": 1 }`, check Unique
- Create another: `{ "email": 1 }`, check Unique

**Repeat for all 10 collections** (see list above)

---

## 📋 Quick Reference: What You're Creating

### 10 Collections:

1. **users** - User accounts
2. **userpresence** - Online/offline status
3. **publicrooms** - Chat rooms
4. **messages** - All chat messages
5. **privatechats** - Private chat metadata
6. **banners** - App announcements
7. **passwordresets** - Password reset tokens
8. **settings** - User preferences
9. **typing** - Typing indicators
10. **notifications** - In-app notifications

---

## ❓ Still Having Issues?

### Quick Test:

Try creating just ONE collection to test:

**In MongoDB Compass MongoSH:**
```javascript
use('social-app');
db.createCollection('test');
db.test.insertOne({ message: "It works!" });
db.test.find();
```

If this works, then run the full `setup-mongodb.js` script.

### Check Your Connection:

Make sure in `.env` file you have:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

Replace `username`, `password`, `cluster`, and `database` with your actual values.

### IP Whitelist:

In MongoDB Atlas:
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for testing)
4. Confirm

---

## 💡 Recommendation

**Use MongoDB Compass method** - it's the most reliable and you can see exactly what's happening. The visual interface makes it easy to verify everything was created correctly.
