# Call Feature Implementation Guide

This document provides complete implementation steps for the voice/video calling feature.

## Current Status
✅ Call component created (`client/src/components/Call/Call.tsx`)
✅ Call CSS with animations created (`client/src/components/Call/Call.css`)
✅ Call component imported in Home.tsx
✅ TypeScript error fixed

## Remaining Implementation Steps

### 1. Add Call State to Home Component

Add these state variables to `Home.tsx` after the existing state declarations:

```typescript
const [inCall, setInCall] = useState(false);
const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
const [isCallInitiator, setIsCallInitiator] = useState(false);
const [incomingCall, setIncomingCall] = useState<{
  from: string;
  fromName: string;
  fromPicture?: string;
  callType: 'voice' | 'video';
} | null>(null);
```

### 2. Add Call Functions to Home Component

Add these functions before the return statement in `Home.tsx`:

```typescript
const startCall = (type: 'voice' | 'video') => {
  if (!selectedPrivateChat) return;
  
  setCallType(type);
  setIsCallInitiator(true);
  setInCall(true);
  
  if (socket) {
    socket.emit('initiate-call', {
      to: selectedPrivateChat.otherUser.userId,
      callType: type,
      from: user.userId,
      fromName: user.fullName || user.username,
      fromPicture: user.profilePicture
    });
  }
};

const handleCallEnd = () => {
  setInCall(false);
  setCallType(null);
  setIsCallInitiator(false);
  setIncomingCall(null);
};

const acceptIncomingCall = () => {
  if (!incomingCall) return;
  
  setCallType(incomingCall.callType);
  setIsCallInitiator(false);
  setInCall(true);
  setIncomingCall(null);
  
  if (socket) {
    socket.emit('call-accepted', {
      to: incomingCall.from
    });
  }
};

const declineIncomingCall = () => {
  if (!incomingCall || !socket) return;
  
  socket.emit('call-rejected', {
    to: incomingCall.from
  });
  
  setIncomingCall(null);
};
```

### 3. Add Socket Event Listeners for Calls

Add these socket listeners in the socket useEffect (around line 240):

```typescript
socket.on('incoming-call', (data: {
  from: string;
  fromName: string;
  fromPicture?: string;
  callType: 'voice' | 'video';
}) => {
  setIncomingCall(data);
});
```

### 4. Add Call Buttons to Private Chat Header

Replace the chat header section in the return statement (around line 1100) with:

```typescript
<div className="chat-header">
  <div className="chat-title">
    {selectedRoom ? (
      <>
        <span className="room-icon">
          {selectedRoom.name === 'General' ? '💬' : selectedRoom.name === 'Gaming' ? '🎮' : '💻'}
        </span>
        <div>
          <h2>{selectedRoom.name}</h2>
          <p className="chat-description">{selectedRoom.description}</p>
        </div>
      </>
    ) : selectedPrivateChat ? (
      <>
        <div className="user-avatar" style={{ width: '45px', height: '45px', fontSize: '1.1rem' }}>
          {selectedPrivateChat.otherUser.profilePicture ? (
            <img src={selectedPrivateChat.otherUser.profilePicture} alt={selectedPrivateChat.otherUser.displayName} />
          ) : (
            selectedPrivateChat.otherUser.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2>{selectedPrivateChat.otherUser.username}</h2>
          <p className="chat-description">
            {selectedPrivateChat.otherUser.age && (
              <span className="chat-header-info">{selectedPrivateChat.otherUser.age} years old</span>
            )}
            {selectedPrivateChat.otherUser.gender && (
              <>
                {selectedPrivateChat.otherUser.age && <span className="chat-header-separator"> • </span>}
                <span className={`chat-header-info chat-header-gender ${selectedPrivateChat.otherUser.gender.toLowerCase()}`}>
                  {selectedPrivateChat.otherUser.gender}
                </span>
              </>
            )}
            {selectedPrivateChat.otherUser.status && (
              <>
                {(selectedPrivateChat.otherUser.age || selectedPrivateChat.otherUser.gender) && <span className="chat-header-separator"> • </span>}
                <span className="chat-header-info chat-header-status">
                  <span className={`status-dot ${selectedPrivateChat.otherUser.status}`}></span>
                  {selectedPrivateChat.otherUser.status}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="call-buttons">
          <button
            className="call-action-button voice-call-button"
            onClick={() => startCall('voice')}
            title="Voice Call"
            aria-label="Start voice call"
          >
            📞
          </button>
          <button
            className="call-action-button video-call-button"
            onClick={() => startCall('video')}
            title="Video Call"
            aria-label="Start video call"
          >
            📹
          </button>
        </div>
      </>
    ) : null}
  </div>
</div>
```

### 5. Add Call Component Render

Add this at the end of the return statement, just before the closing `</div>`:

```typescript
{inCall && selectedPrivateChat && callType && (
  <Call
    socket={socket}
    user={user}
    otherUser={selectedPrivateChat.otherUser}
    callType={callType}
    isInitiator={isCallInitiator}
    onCallEnd={handleCallEnd}
  />
)}

{incomingCall && !inCall && (
  <div className="incoming-call-overlay">
    <div className="incoming-call-modal">
      <div className="incoming-call-avatar">
        {incomingCall.fromPicture ? (
          <img src={incomingCall.fromPicture} alt={incomingCall.fromName} />
        ) : (
          <div className="avatar-fallback">
            {incomingCall.fromName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h3>{incomingCall.fromName}</h3>
      <p>Incoming {incomingCall.callType} call...</p>
      <div className="incoming-call-actions">
        <button
          className="call-button call-button-accept"
          onClick={acceptIncomingCall}
        >
          <span className="button-icon">📞</span>
          <span className="button-label">Accept</span>
        </button>
        <button
          className="call-button call-button-reject"
          onClick={declineIncomingCall}
        >
          <span className="button-icon">✕</span>
          <span className="button-label">Decline</span>
        </button>
      </div>
    </div>
  </div>
)}
```

### 6. Add CSS for Call Buttons

Add to `client/src/components/Home/Home.css`:

```css
/* Call Action Buttons */
.call-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.call-action-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.voice-call-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.voice-call-button:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.video-call-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.video-call-button:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Incoming Call Overlay */
.incoming-call-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  animation: fadeIn 0.3s ease;
}

.incoming-call-modal {
  background: var(--bg-secondary);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s ease;
  min-width: 320px;
}

.incoming-call-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  animation: avatar-float 3s ease-in-out infinite;
}

.incoming-call-avatar img,
.incoming-call-avatar .avatar-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.incoming-call-avatar .avatar-fallback {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

.incoming-call-modal h3 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.incoming-call-modal p {
  margin: 0 0 30px 0;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.incoming-call-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

@media (max-width: 640px) {
  .call-buttons {
    gap: 8px;
  }

  .call-action-button {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .incoming-call-modal {
    padding: 30px 20px;
    min-width: 280px;
  }

  .incoming-call-avatar {
    width: 100px;
    height: 100px;
  }
}
```

### 7. Backend Socket Handlers

Add to `server/socket/messageHandlers.js`:

```javascript
// Call signaling handlers
socket.on('initiate-call', (data) => {
  const { to, callType, from, fromName, fromPicture } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('incoming-call', {
      from,
      fromName,
      fromPicture,
      callType
    });
  }
});

socket.on('call-offer', (data) => {
  const { offer, to, callType } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('call-offer', { offer, callType });
  }
});

socket.on('call-answer', (data) => {
  const { answer, to } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('call-answer', { answer });
  }
});

socket.on('ice-candidate', (data) => {
  const { candidate, to } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('ice-candidate', { candidate });
  }
});

socket.on('call-accepted', (data) => {
  const { to } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('call-accepted');
  }
});

socket.on('call-rejected', (data) => {
  const { to } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('call-rejected');
  }
});

socket.on('end-call', (data) => {
  const { to } = data;
  const recipientSocketId = userSockets.get(to);
  
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('call-ended');
  }
});

socket.on('call-ended-log', async (data) => {
  const { receiverId, callType, duration } = data;
  
  try {
    const sender = await db.collection('users').findOne({ _id: new ObjectId(socket.userId) });
    const receiver = await db.collection('users').findOne({ _id: new ObjectId(receiverId) });
    
    if (!sender || !receiver) return;
    
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const callMessage = {
      messageId: new ObjectId().toString(),
      senderId: socket.userId,
      senderName: sender.fullName || sender.username,
      receiverId: receiverId,
      content: `${callType === 'video' ? '📹' : '📞'} Call ended - ${formatDuration(duration)}`,
      messageType: 'call-log',
      timestamp: new Date(),
      isRead: false
    };
    
    await db.collection('private_messages').insertOne(callMessage);
    
    // Send to both users
    const senderSocketId = userSockets.get(socket.userId);
    const receiverSocketId = userSockets.get(receiverId);
    
    if (senderSocketId) {
      io.to(senderSocketId).emit('private_message', callMessage);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('private_message', callMessage);
    }
  } catch (error) {
    console.error('Error logging call:', error);
  }
});
```

## Testing Checklist

- [ ] Voice call initiates correctly
- [ ] Video call initiates correctly
- [ ] Incoming call notification shows
- [ ] Accept call works
- [ ] Decline call works
- [ ] Mute button works
- [ ] Camera toggle works (video only)
- [ ] Hang up ends call for both users
- [ ] Call duration displays correctly
- [ ] Call log message appears after call
- [ ] Works on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Works on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Works on tablets
- [ ] No console errors
- [ ] Professional animations working
- [ ] Responsive design working

## Browser Compatibility Notes

- WebRTC is supported in all modern browsers
- iOS Safari requires HTTPS for camera/microphone access (use ngrok for testing)
- Some browsers may require user gesture to start calls
- Test with different network conditions

## Security Considerations

- Always use HTTPS in production
- Implement rate limiting for call initiation
- Add call timeout for unanswered calls
- Consider adding call recording consent
- Implement proper error handling for permission denials

## Performance Tips

- Use TURN servers for better connectivity in restrictive networks
- Implement bandwidth adaptation for poor connections
- Add call quality indicators
- Consider implementing call reconnection logic

## Future Enhancements

- Group calls
- Screen sharing
- Call recording
- Call history page
- Missed call notifications
- Call waiting
- Do not disturb mode
