import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

export function setupMessageHandlers(io, socket) {
  const db = getDatabase();

  // Join a room
  socket.on('join_room', async (data) => {
    try {
      const { roomId, userId, username } = data;
      
      socket.join(roomId);
      console.log(`📥 ${username} joined room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
        username,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave a room
  socket.on('leave_room', async (data) => {
    try {
      const { roomId, userId, username } = data;
      
      socket.leave(roomId);
      console.log(`📤 ${username} left room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_left', {
        username,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Send message to public room
  socket.on('send_room_message', async (data) => {
    try {
      const { roomId, senderId, senderName, content, messageType = 'text' } = data;

      // Store message in database
      const message = {
        senderId: new ObjectId(senderId),
        roomId: new ObjectId(roomId),
        content,
        messageType,
        isPrivate: false,
        isRead: false,
        isEdited: false,
        timestamp: new Date()
      };

      const result = await db.collection('messages').insertOne(message);
      
      // Prepare message for broadcasting
      const broadcastMessage = {
        messageId: result.insertedId.toString(),
        senderId,
        senderName,
        content,
        messageType,
        timestamp: message.timestamp
      };

      // Broadcast to all users in the room (including sender)
      io.to(roomId).emit('room_message', broadcastMessage);
      
      console.log(`💬 Message sent in room ${roomId} by ${senderName}`);
    } catch (error) {
      console.error('Error sending room message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send private message
  socket.on('send_private_message', async (data) => {
    try {
      const { receiverId, senderId, senderName, content, messageType = 'text' } = data;

      // Store message in database
      const message = {
        senderId: new ObjectId(senderId),
        receiverId: new ObjectId(receiverId),
        content,
        messageType,
        isPrivate: true,
        isRead: false,
        isEdited: false,
        timestamp: new Date()
      };

      const result = await db.collection('messages').insertOne(message);

      // Find or create private chat
      const privateChat = await db.collection('privatechats').findOne({
        participants: { 
          $all: [new ObjectId(senderId), new ObjectId(receiverId)]
        }
      });

      let chatId;
      if (privateChat) {
        // Update existing chat
        chatId = privateChat._id;
        await db.collection('privatechats').updateOne(
          { _id: privateChat._id },
          {
            $set: {
              lastMessageId: result.insertedId,
              lastMessageAt: new Date()
            }
          }
        );
      } else {
        // Create new private chat
        const newChat = await db.collection('privatechats').insertOne({
          participants: [new ObjectId(senderId), new ObjectId(receiverId)],
          lastMessageId: result.insertedId,
          lastMessageAt: new Date(),
          isActive: true,
          unreadCount: {},
          createdAt: new Date()
        });
        chatId = newChat.insertedId;
      }

      // Prepare message for broadcasting
      const broadcastMessage = {
        messageId: result.insertedId.toString(),
        chatId: chatId.toString(),
        senderId,
        receiverId,
        senderName,
        content,
        messageType,
        timestamp: message.timestamp
      };

      // Send to sender
      socket.emit('private_message', broadcastMessage);

      // Send to receiver (if they're online)
      socket.to(receiverId).emit('private_message', broadcastMessage);
      
      console.log(`🔒 Private message sent from ${senderName} to ${receiverId}`);
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // User typing indicator
  socket.on('typing', (data) => {
    try {
      const { roomId, userId, username, isPrivate, targetId } = data;
      
      if (isPrivate && targetId) {
        // Send typing to specific user
        socket.to(targetId).emit('user_typing', { userId, username });
      } else if (roomId) {
        // Send typing to room
        socket.to(roomId).emit('user_typing', { userId, username });
      }
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  // User stopped typing
  socket.on('stop_typing', (data) => {
    try {
      const { roomId, userId, isPrivate, targetId } = data;
      
      if (isPrivate && targetId) {
        socket.to(targetId).emit('user_stop_typing', { userId });
      } else if (roomId) {
        socket.to(roomId).emit('user_stop_typing', { userId });
      }
    } catch (error) {
      console.error('Error handling stop typing:', error);
    }
  });

  // Mark message as read
  socket.on('mark_as_read', async (data) => {
    try {
      const { messageId } = data;
      
      await db.collection('messages').updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { isRead: true } }
      );
      
      console.log(`✓ Message ${messageId} marked as read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Get room messages (history)
  socket.on('get_room_messages', async (data) => {
    try {
      const { roomId, limit = 50 } = data;
      
      const messages = await db.collection('messages')
        .find({ 
          roomId: new ObjectId(roomId),
          isPrivate: false
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get sender information
      const messagesWithSenders = await Promise.all(
        messages.map(async (msg) => {
          const sender = await db.collection('users').findOne(
            { _id: msg.senderId },
            { projection: { username: 1, displayName: 1 } }
          );
          
          return {
            messageId: msg._id.toString(),
            senderId: msg.senderId.toString(),
            senderName: sender?.displayName || sender?.username || 'Unknown',
            content: msg.content,
            messageType: msg.messageType,
            timestamp: msg.timestamp
          };
        })
      );

      socket.emit('room_messages', {
        roomId,
        messages: messagesWithSenders.reverse()
      });
    } catch (error) {
      console.error('Error getting room messages:', error);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  });

  // Get private messages
  socket.on('get_private_messages', async (data) => {
    try {
      const { userId, otherUserId, limit = 50 } = data;
      
      const messages = await db.collection('messages')
        .find({
          isPrivate: true,
          $or: [
            { senderId: new ObjectId(userId), receiverId: new ObjectId(otherUserId) },
            { senderId: new ObjectId(otherUserId), receiverId: new ObjectId(userId) }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get sender information
      const messagesWithSenders = await Promise.all(
        messages.map(async (msg) => {
          const sender = await db.collection('users').findOne(
            { _id: msg.senderId },
            { projection: { username: 1, displayName: 1 } }
          );
          
          return {
            messageId: msg._id.toString(),
            senderId: msg.senderId.toString(),
            receiverId: msg.receiverId.toString(),
            senderName: sender?.displayName || sender?.username || 'Unknown',
            content: msg.content,
            messageType: msg.messageType,
            timestamp: msg.timestamp,
            isRead: msg.isRead
          };
        })
      );

      socket.emit('private_messages', {
        otherUserId,
        messages: messagesWithSenders.reverse()
      });
    } catch (error) {
      console.error('Error getting private messages:', error);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  });
}
