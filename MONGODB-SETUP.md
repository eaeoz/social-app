# MongoDB Database Setup Guide

## Quick Setup

You have **3 options** to set up your MongoDB database:

---

## Option 1: Run the Setup Script (Recommended)

### Using MongoDB Shell (mongosh):

1. Open MongoDB Shell (mongosh)
2. Connect to your MongoDB Atlas cluster:
   ```bash
   mongosh "mongodb+srv://<your-cluster-url>"
   ```
3. Load and run the setup script:
   ```bash
   load('setup-mongodb.js')
   ```

### Using MongoDB Compass:

1. Open MongoDB Compass
2. Connect to your database
3. Go to "MongoSH" tab at the bottom
4. Copy the entire content of `setup-mongodb.js` and paste it
5. Press Enter to execute

---

## Option 2: Manual Creation via MongoDB Compass

For each collection, follow these steps:

1. Click "Create Collection" in MongoDB Compass
2. Enter the collection name
3. Click "Advanced Collection Options"
4. Paste the validator code from the sections below
5. Click "Create Collection"
6. Then create indexes manually

### Collections to Create:

#### 1. users
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "passwordHash", "createdAt"],
      properties: {
        username: { bsonType: "string" },
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        displayName: { bsonType: "string" },
        profilePictureId: { bsonType: "string" },
        bio: { bsonType: "string" },
        status: { bsonType: "string", enum: ["online", "offline", "away", "busy"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        lastSeen: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ username: 1 }` - unique
- `{ email: 1 }` - unique

#### 2. userpresence
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "isOnline", "lastSeen"],
      properties: {
        userId: { bsonType: "objectId" },
        isOnline: { bsonType: "bool" },
        socketId: { bsonType: "string" },
        lastSeen: { bsonType: "date" },
        deviceInfo: { bsonType: "string" }
      }
    }
  }
}
```
**Indexes:**
- `{ userId: 1 }` - unique
- `{ isOnline: 1 }`

#### 3. publicrooms
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "createdBy", "createdAt", "isActive"],
      properties: {
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        createdBy: { bsonType: "objectId" },
        participants: { bsonType: "array", items: { bsonType: "objectId" } },
        isActive: { bsonType: "bool" },
        isPrivate: { bsonType: "bool" },
        maxParticipants: { bsonType: "int" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ name: 1 }`
- `{ isActive: 1 }`

#### 4. messages
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["senderId", "content", "timestamp", "isPrivate"],
      properties: {
        senderId: { bsonType: "objectId" },
        receiverId: { bsonType: "objectId" },
        roomId: { bsonType: "objectId" },
        content: { bsonType: "string" },
        messageType: { bsonType: "string", enum: ["text", "image", "file", "system"] },
        isPrivate: { bsonType: "bool" },
        isRead: { bsonType: "bool" },
        isEdited: { bsonType: "bool" },
        attachments: { bsonType: "array" },
        timestamp: { bsonType: "date" },
        editedAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ senderId: 1 }`
- `{ receiverId: 1 }`
- `{ roomId: 1 }`
- `{ timestamp: -1 }`
- `{ isPrivate: 1, senderId: 1, receiverId: 1 }`

#### 5. privatechats
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participants", "createdAt"],
      properties: {
        participants: { 
          bsonType: "array", 
          items: { bsonType: "objectId" },
          minItems: 2,
          maxItems: 2
        },
        lastMessageId: { bsonType: "objectId" },
        lastMessageAt: { bsonType: "date" },
        isActive: { bsonType: "bool" },
        unreadCount: { bsonType: "object" },
        createdAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ participants: 1 }`
- `{ lastMessageAt: -1 }`

#### 6. banners
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "imageUrl", "active", "createdAt"],
      properties: {
        title: { bsonType: "string" },
        imageUrl: { bsonType: "string" },
        link: { bsonType: "string" },
        description: { bsonType: "string" },
        active: { bsonType: "bool" },
        displayOrder: { bsonType: "int" },
        startDate: { bsonType: "date" },
        endDate: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ active: 1 }`
- `{ displayOrder: 1 }`

#### 7. passwordresets
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "token", "expiresAt", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        token: { bsonType: "string" },
        expiresAt: { bsonType: "date" },
        used: { bsonType: "bool" },
        createdAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ userId: 1 }`
- `{ token: 1 }` - unique
- `{ expiresAt: 1 }` - TTL index (expireAfterSeconds: 0)

#### 8. settings
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "theme", "notifications", "language"],
      properties: {
        userId: { bsonType: "objectId" },
        theme: { bsonType: "string", enum: ["dark", "light", "auto"] },
        notifications: { bsonType: "bool" },
        notificationSettings: { bsonType: "object" },
        language: { bsonType: "string" },
        privacy: { bsonType: "object" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ userId: 1 }` - unique

#### 9. typing
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "targetId", "targetType", "timestamp"],
      properties: {
        userId: { bsonType: "objectId" },
        targetId: { bsonType: "objectId" },
        targetType: { bsonType: "string", enum: ["room", "private"] },
        timestamp: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ targetId: 1, targetType: 1 }`
- `{ timestamp: 1 }` - TTL index (expireAfterSeconds: 10)

#### 10. notifications
```javascript
{
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "content", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        type: { bsonType: "string", enum: ["message", "mention", "room_invite", "system"] },
        content: { bsonType: "string" },
        data: { bsonType: "object" },
        isRead: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        readAt: { bsonType: "date" }
      }
    }
  }
}
```
**Indexes:**
- `{ userId: 1, isRead: 1 }`
- `{ createdAt: -1 }`
- `{ createdAt: 1 }` - TTL index (expireAfterSeconds: 2592000)

---

## Option 3: Using Node.js Script

If you have Node.js and MongoDB driver installed:

```bash
npm install mongodb
node -e "require('./setup-mongodb.js')"
```

---

## Verification

After setup, verify all collections exist:

```javascript
show collections
```

You should see:
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

Check indexes for a collection:

```javascript
db.users.getIndexes()
```

---

## Collection Purposes

- **users**: User accounts and profiles
- **userpresence**: Real-time online/offline status
- **publicrooms**: Public chat rooms
- **messages**: All messages (public and private)
- **privatechats**: Private chat metadata
- **banners**: App banners/announcements
- **passwordresets**: Password reset tokens
- **settings**: User preferences
- **typing**: Typing indicators (auto-expires)
- **notifications**: In-app notifications (auto-expires after 30 days)

---

## Notes

- TTL indexes automatically delete old data
- Unique indexes prevent duplicates
- All ObjectId references link to the users collection
- Profile pictures are stored in Appwrite, only fileId is in MongoDB
