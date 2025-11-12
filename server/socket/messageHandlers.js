import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

// Middleware to validate user still exists in database
async function validateUserExists(userId) {
  if (!userId) return false;
  
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return !!user;
  } catch (error) {
    console.error('Error validating user existence:', error);
    return false;
  }
}

export function setupMessageHandlers(io, socket, userSockets) {
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
      
      // Update user's last seen time for this room
      await db.collection('userroomactivity').updateOne(
        { 
          userId: new ObjectId(userId),
          roomId: new ObjectId(roomId)
        },
        {
          $set: {
            lastSeenAt: new Date()
          },
          $setOnInsert: {
            userId: new ObjectId(userId),
            roomId: new ObjectId(roomId),
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      
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

      // Broadcast message to all users in the room (including sender)
      io.to(roomId).emit('room_message', broadcastMessage);
      
      // Broadcast notification to all connected users (for unread count updates)
      // This notifies users NOT in the room about new messages
      io.emit('room_message_notification', {
        roomId,
        senderId,
        timestamp: message.timestamp
      });
      
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

      // Send to receiver only (sender already has it from optimistic update)
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId && receiverSocketId !== socket.id) {
        io.to(receiverSocketId).emit('private_message', broadcastMessage);
        console.log(`🔒 Private message sent from ${senderName} to ${receiverId} (socket: ${receiverSocketId})`);
      } else if (receiverSocketId === socket.id) {
        console.log(`⚠️ Sender and receiver are the same user (self-message)`);
      } else {
        console.log(`⚠️ Receiver ${receiverId} is not online`);
      }
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // User typing indicator
  socket.on('typing', async (data) => {
    try {
      const { roomId, userId, username, isPrivate, targetId } = data;
      
      // Validate user still exists
      const userExists = await validateUserExists(userId);
      if (!userExists) {
        console.log(`⚠️ User ${userId} no longer exists, disconnecting socket`);
        socket.emit('force_logout', { reason: 'User account deleted' });
        socket.disconnect(true);
        return;
      }
      
      if (isPrivate && targetId) {
        // Validate target user still exists
        const targetExists = await validateUserExists(targetId);
        if (!targetExists) {
          console.log(`⚠️ Target user ${targetId} no longer exists`);
          return;
        }
        
        // Send typing to specific user (private chat)
        const targetSocketId = userSockets.get(targetId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('user_typing', { userId, username });
          console.log(`⌨️ ${username} is typing to ${targetId}`);
        }
      } else if (roomId) {
        // Send typing to room
        socket.to(roomId).emit('user_typing', { userId, username });
      }
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  // User stopped typing
  socket.on('stop_typing', async (data) => {
    try {
      const { roomId, userId, username, isPrivate, targetId } = data;
      
      // Validate user still exists
      const userExists = await validateUserExists(userId);
      if (!userExists) {
        console.log(`⚠️ User ${userId} no longer exists, disconnecting socket`);
        socket.emit('force_logout', { reason: 'User account deleted' });
        socket.disconnect(true);
        return;
      }
      
      if (isPrivate && targetId) {
        // Send stop typing to specific user (private chat)
        const targetSocketId = userSockets.get(targetId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('user_stop_typing', { userId, username });
          console.log(`⌨️ ${username} stopped typing to ${targetId}`);
        }
      } else if (roomId) {
        socket.to(roomId).emit('user_stop_typing', { userId, username });
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

  // Mark entire chat as read
  socket.on('mark_chat_as_read', async (data) => {
    try {
      const { userId, otherUserId } = data;
      
      // Mark all messages from the other user as read
      const result = await db.collection('messages').updateMany(
        {
          isPrivate: true,
          receiverId: new ObjectId(userId),
          senderId: new ObjectId(otherUserId),
          isRead: false
        },
        { $set: { isRead: true } }
      );
      
      console.log(`✓ Marked ${result.modifiedCount} messages as read for chat between ${userId} and ${otherUserId}`);
    } catch (error) {
      console.error('Error marking chat as read:', error);
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
            { projection: { username: 1, displayName: 1, nickName: 1 } }
          );
          
          return {
            messageId: msg._id.toString(),
            senderId: msg.senderId.toString(),
            senderName: sender?.nickName || sender?.displayName || sender?.username || 'Unknown',
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
            { projection: { username: 1, displayName: 1, nickName: 1 } }
          );
          
          return {
            messageId: msg._id.toString(),
            senderId: msg.senderId.toString(),
            receiverId: msg.receiverId.toString(),
            senderName: sender?.nickName || sender?.displayName || sender?.username || 'Unknown',
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

  // WebRTC Call Signaling Handlers
  
  // Initiate a call
  socket.on('initiate-call', (data) => {
    try {
      const { to, callType, from, fromName, fromPicture } = data;
      const toSocketId = userSockets.get(to);
      
      console.log(`📞 Call initiation attempt from ${fromName} (${from}) to ${to} (${callType})`);
      console.log(`📊 userSockets size: ${userSockets.size}, looking for userId: ${to}`);
      console.log(`📍 Target socket ID: ${toSocketId || 'NOT FOUND'}`);
      
      if (toSocketId) {
        // Verify the socket is still connected
        const targetSocket = io.sockets.sockets.get(toSocketId);
        if (targetSocket && targetSocket.connected) {
          io.to(toSocketId).emit('incoming-call', {
            from,
            fromName,
            fromPicture,
            callType
          });
          console.log(`📞 Call initiated from ${fromName} to ${to} (${callType}) - socket ${toSocketId}`);
        } else {
          console.log(`⚠️ Socket ${toSocketId} for user ${to} is not connected`);
          // Clean up stale socket reference
          userSockets.delete(to);
          socket.emit('error', { message: 'User is not online' });
        }
      } else {
        // Log all registered users for debugging
        console.log(`⚠️ User ${to} is not in userSockets map`);
        console.log(`📋 Registered users:`, Array.from(userSockets.keys()));
        socket.emit('error', { message: 'User is not online' });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      socket.emit('error', { message: 'Failed to initiate call' });
    }
  });

  // Call accepted
  socket.on('call-accepted', (data) => {
    try {
      const { to } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-accepted');
        console.log(`✅ Call accepted by user, notifying ${to}`);
      }
    } catch (error) {
      console.error('Error handling call acceptance:', error);
    }
  });

  // Call rejected
  socket.on('call-rejected', (data) => {
    try {
      const { to } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-rejected');
        console.log(`❌ Call rejected by user, notifying ${to}`);
      }
    } catch (error) {
      console.error('Error handling call rejection:', error);
    }
  });

  // WebRTC offer
  socket.on('call-offer', (data) => {
    try {
      const { to, offer, callType } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-offer', { offer, callType });
        console.log(`📡 Call offer sent to ${to}`);
      }
    } catch (error) {
      console.error('Error sending call offer:', error);
    }
  });

  // WebRTC answer
  socket.on('call-answer', (data) => {
    try {
      const { to, answer } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-answer', { answer });
        console.log(`📡 Call answer sent to ${to}`);
      }
    } catch (error) {
      console.error('Error sending call answer:', error);
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (data) => {
    try {
      const { to, candidate } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('ice-candidate', { candidate });
        console.log(`🧊 ICE candidate sent to ${to}`);
      }
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  });

  // End call
  socket.on('end-call', (data) => {
    try {
      const { to } = data;
      const toSocketId = userSockets.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-ended');
        console.log(`📴 Call ended, notifying ${to}`);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  });

  // Log call ended (for message history)
  socket.on('call-ended-log', async (data) => {
    try {
      const { receiverId, callType, duration } = data;
      const userId = socket.userId;
      
      if (!userId) return;

      // Store call log as a special message
      const message = {
        senderId: new ObjectId(userId),
        receiverId: new ObjectId(receiverId),
        content: `${callType === 'video' ? '📹' : '📞'} ${callType.charAt(0).toUpperCase() + callType.slice(1)} call - ${Math.floor(duration / 60)}m ${duration % 60}s`,
        messageType: 'call-log',
        isPrivate: true,
        isRead: false,
        isEdited: false,
        timestamp: new Date(),
        callDuration: duration,
        callType
      };

      await db.collection('messages').insertOne(message);
      console.log(`📝 Call log saved: ${callType} call, ${duration}s`);
    } catch (error) {
      console.error('Error logging call:', error);
    }
  });

  // User logout event - notify others and end active calls
  socket.on('user-logout', (data) => {
    try {
      const { reason } = data;
      const userId = socket.userId;
      
      if (!userId) return;
      
      console.log(`🚪 User ${userId} logging out (reason: ${reason})`);
      
      // Notify all connected users that this user is logging out
      // This is particularly important for ending active calls
      io.emit('user-logged-out', {
        userId,
        reason,
        timestamp: new Date()
      });
      
      console.log(`📡 Broadcasted logout event for user ${userId}`);
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  });
}
