# Call Cancellation Bug Fix

## Problem Description
When User A initiated a call to User B, and User B saw the incoming call window with ringing sound, if User A cancelled the call before User B answered, the ringing sound continued playing on User B's side even though the call was cancelled.

## Root Cause
The issue was in the call cancellation flow:

1. When the caller clicked "Cancel" during the ringing state, the Call component emitted an `end-call` event to the backend
2. The backend received this event and emitted `call-ended` to the receiver
3. However, the receiver's Home.tsx component was listening for `call-cancelled` event (which properly stops the ringtone), not `call-ended`
4. The backend never emitted the `call-cancelled` event, causing a mismatch

## Solution Implemented

### 1. Backend Changes (`server/socket/messageHandlers.js`)
Modified the `end-call` socket handler to differentiate between:
- **Call cancelled during ringing**: Emits `call-cancelled` event
- **Call ended after connection**: Emits `call-ended` event

```javascript
socket.on('end-call', (data) => {
  try {
    const { to, callState } = data;
    const toSocketId = userSockets.get(to);
    
    if (toSocketId) {
      // If call was cancelled during ringing (before answer), send call-cancelled
      // Otherwise send call-ended for active calls
      if (callState === 'ringing') {
        io.to(toSocketId).emit('call-cancelled');
        console.log(`🚫 Call cancelled (ringing), notifying ${to}`);
      } else {
        io.to(toSocketId).emit('call-ended');
        console.log(`📴 Call ended, notifying ${to}`);
      }
    }
  } catch (error) {
    console.error('Error ending call:', error);
  }
});
```

### 2. Frontend Changes (`client/src/components/Call/Call.tsx`)
Modified the `endCall` function to:
- Pass the current `callState` to the backend when emitting `end-call`
- Only log call duration if the call was actually connected (not just ringing)

```typescript
const endCall = () => {
  if (socket && callState !== 'ended') {
    socket.emit('end-call', { 
      to: otherUser.userId,
      callState: callState // Pass current call state to backend
    });
  }
  
  cleanup();
  setCallState('ended');
  
  // Send call log message only if call was connected
  if (socket && callStartTimeRef.current && callState === 'connected') {
    const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
    socket.emit('call-ended-log', {
      receiverId: otherUser.userId,
      callType,
      duration
    });
  }
  
  setTimeout(() => {
    onCallEnd();
  }, 1000);
};
```

## How It Works Now

### Scenario 1: Call Cancelled During Ringing
1. User A calls User B → Call state is `'ringing'`
2. User B hears ringtone (via `ringtoneManager.startRingtone()`)
3. User A clicks "Cancel" → `endCall()` is called with `callState = 'ringing'`
4. Backend receives `end-call` with `callState: 'ringing'`
5. Backend emits `call-cancelled` to User B
6. User B's `call-cancelled` event handler stops the ringtone (via `ringtoneManager.stopRingtone()`)
7. Incoming call modal closes

### Scenario 2: Call Ended After Connection
1. User A calls User B → Call state is `'ringing'`
2. User B accepts → Call state changes to `'connecting'` then `'connected'`
3. Users are talking → Call state is `'connected'`
4. Either user clicks "End" → `endCall()` is called with `callState = 'connected'`
5. Backend receives `end-call` with `callState: 'connected'`
6. Backend emits `call-ended` to the other user
7. Both users' call windows close
8. Call duration is logged in the chat history

## Benefits
- ✅ Ringtone now properly stops when call is cancelled before being answered
- ✅ No unnecessary call log entries for unanswered/cancelled calls
- ✅ Clear separation between cancelled calls and ended calls
- ✅ Better user experience with proper cleanup

## Additional Issues Found and Fixed

### Netlify Deployment Issues (Not Related to Call Cancellation Fix)

During testing, the following pre-existing deployment issues were discovered:

#### 1. Content Security Policy (CSP) Blocking Audio
**Problem**: Notification sounds were blocked by CSP because `media-src` directive was missing.

**Error**: `Content-Security-Policy: The page's settings blocked the loading of a resource (media-src) at data:audio/wav`

**Solution**: Added `media-src 'self' data: blob:;` to the CSP in `client/netlify.toml`

#### 2. Permissions Policy Blocking Camera/Microphone
**Problem**: Camera and microphone access was completely disabled in production.

**Error**: 
- `[Violation] Permissions policy violation: microphone is not allowed in this document.`
- `[Violation] Permissions policy violation: camera is not allowed in this document.`
- `Error initializing call: NotAllowedError: Permission denied`

**Solution**: Changed Permissions-Policy from:
- `microphone=(), camera=()` (completely disabled)
- To: `microphone=(self), camera=(self)` (enabled for same-origin)

### Files Modified for Deployment Fix
3. `client/netlify.toml` - Added `media-src` to CSP and enabled camera/microphone permissions

## Testing Checklist
- [x] Call cancellation during ringing stops the ringtone immediately
- [ ] Call ending after connection works properly
- [ ] Call logs are only created for connected calls
- [ ] No console errors during call cancellation
- [ ] Works on both voice and video calls
- [ ] Works with Do Not Disturb mode enabled
- [ ] Message notification sounds play correctly on Netlify
- [ ] Camera and microphone permissions work on Netlify
- [ ] Calls can connect successfully on Netlify (not just localhost)

## Important Notes

The issues with:
- Message notification sounds not playing
- Calls not connecting on Netlify
- "Permission denied" errors for camera/microphone

Were **NOT caused by the call cancellation fix**. These were pre-existing deployment/configuration issues in the Netlify security headers that blocked media and device access.

## Files Modified
1. `server/socket/messageHandlers.js` - Added call state handling in `end-call` event
2. `client/src/components/Call/Call.tsx` - Modified `endCall()` to pass call state and conditionally log calls
3. `client/netlify.toml` - Fixed CSP and Permissions-Policy for audio and WebRTC functionality

## Deployment Instructions
After these changes, you need to:
1. Commit and push the changes
2. Redeploy to Netlify
3. Clear browser cache or use incognito mode to test
4. Grant camera/microphone permissions when prompted

## Date
November 15, 2025
