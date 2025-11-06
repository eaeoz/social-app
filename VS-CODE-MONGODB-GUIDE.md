# Using VS Code MongoDB Extension

## Step-by-Step Guide to Create Collections

### Prerequisites
1. Install **MongoDB for VS Code** extension
2. Connect to your MongoDB Atlas cluster in VS Code

### Method 1: Using the Playground File (EASIEST)

1. **Open the playground file**: `create-collections.mongodb`

2. **Connect to your database**:
   - Click on the MongoDB icon in VS Code sidebar
   - Click "Add Connection"
   - Paste your connection string:
     ```
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
     ```
   - Or use the connection string from your `.env` file

3. **Run the script**:
   
   **Option A - Play Button:**
   - Open `create-collections.mongodb` file
   - Look for the **▶ Play** button at the top right corner
   - Click it to run all commands
   
   **Option B - Command Palette:**
   - Press **Ctrl+Shift+P** (Windows/Linux) or **Cmd+Shift+P** (Mac)
   - Type "MongoDB: Run All"
   - Or type "MongoDB" and look for run commands
   
   **Option C - Right-Click:**
   - Right-click anywhere in the file
   - Select "Run All" or "Execute All" option

4. **Verify**:
   - Check the output panel at the bottom
   - You should see all collections listed
   - Expand your database in the MongoDB sidebar to see all 10 collections

### Method 2: Line by Line Execution

If you want to run commands one by one:

1. Open `create-collections.mongodb`
2. Select the lines you want to run (e.g., the `use('social-app');` line)
3. Press **Ctrl+Shift+'** (Windows/Linux) or **Cmd+Shift+'** (Mac)
4. Or right-click → "MongoDB: Run Selected Lines"

### Method 3: Manual Creation via Extension

If the playground doesn't work, create collections manually:

1. **Right-click on your database** in MongoDB sidebar
2. **Select "New Collection"**
3. **Enter collection name** (e.g., "users")
4. **Click Create**
5. **Create indexes**:
   - Right-click on the collection
   - Select "Create Index"
   - Enter index definition, e.g.:
     ```json
     { "username": 1 }
     ```
   - Check "unique" if needed
   - Click Create

Repeat for all 10 collections.

### Collections to Create:

1. **users**
   - Indexes: `{ username: 1 }` (unique), `{ email: 1 }` (unique)

2. **userpresence**
   - Indexes: `{ userId: 1 }` (unique), `{ isOnline: 1 }`

3. **publicrooms**
   - Indexes: `{ name: 1 }`, `{ isActive: 1 }`

4. **messages**
   - Indexes: `{ senderId: 1 }`, `{ receiverId: 1 }`, `{ roomId: 1 }`, `{ timestamp: -1 }`

5. **privatechats**
   - Indexes: `{ participants: 1 }`, `{ lastMessageAt: -1 }`

6. **banners**
   - Indexes: `{ active: 1 }`, `{ displayOrder: 1 }`

7. **passwordresets**
   - Indexes: `{ userId: 1 }`, `{ token: 1 }` (unique), `{ expiresAt: 1 }` (TTL)

8. **settings**
   - Indexes: `{ userId: 1 }` (unique)

9. **typing**
   - Indexes: `{ targetId: 1, targetType: 1 }`, `{ timestamp: 1 }` (TTL: 10 seconds)

10. **notifications**
    - Indexes: `{ userId: 1, isRead: 1 }`, `{ createdAt: -1 }`, `{ createdAt: 1 }` (TTL: 30 days)

### Troubleshooting

#### Connection Issues:
- Make sure you're connected to the internet
- Verify your MongoDB connection string in `.env`
- Check if IP address is whitelisted in MongoDB Atlas
- Try connecting through MongoDB Compass first to verify credentials

#### Playground Not Working:
- Make sure you have MongoDB extension installed
- Check if you're connected to the database (green dot in MongoDB sidebar)
- Try restarting VS Code
- Use Method 3 (manual creation) as fallback

#### Error: "Database not selected":
- Make sure the first line is: `use('social-app');`
- Or manually select your database in the MongoDB extension sidebar

### Verification

After running the script, verify in VS Code:

1. Click MongoDB icon in sidebar
2. Expand your connection
3. Expand "social-app" database
4. You should see all 10 collections:
   - ✅ users
   - ✅ userpresence
   - ✅ publicrooms
   - ✅ messages
   - ✅ privatechats
   - ✅ banners
   - ✅ passwordresets
   - ✅ settings
   - ✅ typing
   - ✅ notifications

### Alternative: Use MongoDB Compass

If VS Code extension is having issues:

1. Download MongoDB Compass (free)
2. Connect using your connection string
3. Open MongoSH tab (bottom of Compass)
4. Copy and paste the entire content of `setup-mongodb.js`
5. Press Enter

This is guaranteed to work!
