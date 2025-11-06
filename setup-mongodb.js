// MongoDB Collection Setup Script
// Run this script in MongoDB Shell or MongoDB Compass

// Connect to your database
use('social-app');

// 1. Create Users Collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'passwordHash', 'createdAt'],
      properties: {
        username: { bsonType: 'string' },
        email: { bsonType: 'string' },
        passwordHash: { bsonType: 'string' },
        displayName: { bsonType: 'string' },
        profilePictureId: { bsonType: 'string' },
        bio: { bsonType: 'string' },
        status: { bsonType: 'string', enum: ['online', 'offline', 'away', 'busy'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        lastSeen: { bsonType: 'date' }
      }
    }
  }
});
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// 2. Create User Presence Collection
db.createCollection('userpresence', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'isOnline', 'lastSeen'],
      properties: {
        userId: { bsonType: 'objectId' },
        isOnline: { bsonType: 'bool' },
        socketId: { bsonType: 'string' },
        lastSeen: { bsonType: 'date' },
        deviceInfo: { bsonType: 'string' }
      }
    }
  }
});
db.userpresence.createIndex({ userId: 1 }, { unique: true });
db.userpresence.createIndex({ isOnline: 1 });

// 3. Create Public Rooms Collection
db.createCollection('publicrooms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'createdBy', 'createdAt', 'isActive'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        createdBy: { bsonType: 'objectId' },
        participants: { bsonType: 'array', items: { bsonType: 'objectId' } },
        isActive: { bsonType: 'bool' },
        isPrivate: { bsonType: 'bool' },
        maxParticipants: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});
db.publicrooms.createIndex({ name: 1 });
db.publicrooms.createIndex({ isActive: 1 });

// 4. Create Messages Collection
db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['senderId', 'content', 'timestamp', 'isPrivate'],
      properties: {
        senderId: { bsonType: 'objectId' },
        receiverId: { bsonType: 'objectId' },
        roomId: { bsonType: 'objectId' },
        content: { bsonType: 'string' },
        messageType: { bsonType: 'string', enum: ['text', 'image', 'file', 'system'] },
        isPrivate: { bsonType: 'bool' },
        isRead: { bsonType: 'bool' },
        isEdited: { bsonType: 'bool' },
        attachments: { bsonType: 'array' },
        timestamp: { bsonType: 'date' },
        editedAt: { bsonType: 'date' }
      }
    }
  }
});
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ receiverId: 1 });
db.messages.createIndex({ roomId: 1 });
db.messages.createIndex({ timestamp: -1 });
db.messages.createIndex({ isPrivate: 1, senderId: 1, receiverId: 1 });

// 5. Create Private Chats Collection
db.createCollection('privatechats', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['participants', 'createdAt'],
      properties: {
        participants: { 
          bsonType: 'array', 
          items: { bsonType: 'objectId' },
          minItems: 2,
          maxItems: 2
        },
        lastMessageId: { bsonType: 'objectId' },
        lastMessageAt: { bsonType: 'date' },
        isActive: { bsonType: 'bool' },
        unreadCount: { bsonType: 'object' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});
db.privatechats.createIndex({ participants: 1 });
db.privatechats.createIndex({ lastMessageAt: -1 });

// 6. Create Banners Collection
db.createCollection('banners', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'imageUrl', 'active', 'createdAt'],
      properties: {
        title: { bsonType: 'string' },
        imageUrl: { bsonType: 'string' },
        link: { bsonType: 'string' },
        description: { bsonType: 'string' },
        active: { bsonType: 'bool' },
        displayOrder: { bsonType: 'int' },
        startDate: { bsonType: 'date' },
        endDate: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});
db.banners.createIndex({ active: 1 });
db.banners.createIndex({ displayOrder: 1 });

// 7. Create Password Resets Collection
db.createCollection('passwordresets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'token', 'expiresAt', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        token: { bsonType: 'string' },
        expiresAt: { bsonType: 'date' },
        used: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});
db.passwordresets.createIndex({ userId: 1 });
db.passwordresets.createIndex({ token: 1 }, { unique: true });
db.passwordresets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 8. Create Settings Collection
db.createCollection('settings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'theme', 'notifications', 'language'],
      properties: {
        userId: { bsonType: 'objectId' },
        theme: { bsonType: 'string', enum: ['dark', 'light', 'auto'] },
        notifications: { bsonType: 'bool' },
        notificationSettings: { bsonType: 'object' },
        language: { bsonType: 'string' },
        privacy: { bsonType: 'object' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});
db.settings.createIndex({ userId: 1 }, { unique: true });

// 9. Create Typing Indicators Collection
db.createCollection('typing', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'targetId', 'targetType', 'timestamp'],
      properties: {
        userId: { bsonType: 'objectId' },
        targetId: { bsonType: 'objectId' },
        targetType: { bsonType: 'string', enum: ['room', 'private'] },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});
db.typing.createIndex({ targetId: 1, targetType: 1 });
db.typing.createIndex({ timestamp: 1 }, { expireAfterSeconds: 10 });

// 10. Create Notifications Collection
db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'content', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        type: { bsonType: 'string', enum: ['message', 'mention', 'room_invite', 'system'] },
        content: { bsonType: 'string' },
        data: { bsonType: 'object' },
        isRead: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        readAt: { bsonType: 'date' }
      }
    }
  }
});
db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

print('✅ All collections created successfully!');
print('✅ All indexes created successfully!');
print('\nCollections created:');
print('- users');
print('- userpresence');
print('- publicrooms');
print('- messages');
print('- privatechats');
print('- banners');
print('- passwordresets');
print('- settings');
print('- typing');
print('- notifications');
