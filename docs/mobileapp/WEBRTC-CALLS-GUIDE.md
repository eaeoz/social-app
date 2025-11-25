# WebRTC Voice & Video Calls - Mobile App Integration Guide

## Overview

The mobile app now supports **full WebRTC voice and video calling** functionality, enabling real-time communication between mobile app users and web client users. This integration provides:

- 📞 **Voice Calls**: High-quality audio calls with echo cancellation and noise suppression
- 📹 **Video Calls**: Real-time video communication with camera controls
- 🔄 **Cross-Platform**: Mobile users can call web users and vice versa
- 🎯 **P2P Connection**: Direct peer-to-peer WebRTC connections using STUN/TURN servers
- 🔔 **Call Notifications**: Incoming call dialogs with accept/decline options

## Architecture

### Components

1. **WebRTC Service** (`mobileapp/src/services/webrtc.service.ts`)
   - Manages WebRTC peer connections
   - Handles media streams (audio/video)
   - Manages ICE candidates for NAT traversal
   - Handles call signaling via Socket.IO

2. **Call Screen** (`mobileapp/src/screens/CallScreen.tsx`)
   - Full-screen call UI for both voice and video calls
   - Real-time video rendering using RTCView
   - Call controls (mute, camera, speaker, etc.)
   - Call duration timer

3. **Private Chat Integration** (`mobileapp/src/screens/PrivateChatScreen.tsx`)
   - Voice/video call buttons in chat header
   - Incoming call dialog

## Features

### Outgoing Calls

- **Initiate calls** from private chat screen
- **Call types**: Voice or Video
- **Ringing feedback**: Visual and audio feedback while waiting for answer
- **Cancel option**: End call before connection

### Incoming Calls

- **Call notifications**: Full-screen dialog with caller information
- **Accept/Decline**: User can accept or reject incoming calls
- **Call type indicator**: Shows if it's voice or video call

### During Call

#### Voice Calls
- 🔇 **Mute/Unmute**: Toggle microphone
- 🔊 **Speaker**: Toggle speaker phone
- ⏱️ **Duration**: Real-time call timer
- 📞 **End Call**: Terminate the call

#### Video Calls
- 🔇 **Mute/Unmute**: Toggle microphone
- 📹 **Camera On/Off**: Toggle camera
- 🔄 **Switch Camera**: Flip between front/back camera
- 🖼️ **Video Preview**: Local video in picture-in-picture
- 📺 **Remote Video**: Full-screen remote user video
- ⏱️ **Duration**: Real-time call timer
- 📞 **End Call**: Terminate the call

## Technical Implementation

### WebRTC Service

```typescript
import { webrtcService } from '../services';

// Initiate outgoing call
await webrtcService.initiateCall(config, otherUser, 'video');

// Accept incoming call
await webrtcService.acceptCall(config, caller, 'voice');

// End call
webrtcService.endCall();

// Toggle controls
webrtcService.toggleMute();
webrtcService.toggleCamera();
webrtcService.switchCamera();
webrtcService.toggleSpeaker(true);
```

### Call Flow

#### Outgoing Call

1. User clicks voice/video button in chat
2. Navigate to Call screen with `isIncoming: false`
3. WebRTC service initiates call
   - Get user media (camera/microphone)
   - Create peer connection
   - Setup socket listeners
   - Emit `initiate-call` event
4. Wait for receiver to accept
5. Exchange WebRTC offer/answer
6. Exchange ICE candidates
7. Establish P2P connection
8. Start call timer

#### Incoming Call

1. Socket receives `initiate-call` event
2. Show incoming call dialog in chat
3. User accepts call
4. Navigate to Call screen with `isIncoming: true`
5. WebRTC service accepts call
   - Get user media
   - Create peer connection
   - Setup socket listeners
   - Emit `call-accepted` event
6. Wait for WebRTC offer
7. Create and send answer
8. Exchange ICE candidates
9. Establish P2P connection
10. Start call timer

### Socket Events

#### Client → Server
- `initiate-call`: Start new call
- `call-accepted`: Accept incoming call
- `call-rejected`: Decline incoming call
- `call-offer`: Send WebRTC offer
- `call-answer`: Send WebRTC answer
- `ice-candidate`: Send ICE candidate
- `end-call`: End active call
- `call-ended-log`: Log call details

#### Server → Client
- `initiate-call`: Receive incoming call
- `call-accepted`: Call was accepted
- `call-rejected`: Call was declined
- `call-cancelled`: Call was cancelled
- `call-offer`: Receive WebRTC offer
- `call-answer`: Receive WebRTC answer
- `ice-candidate`: Receive ICE candidate
- `call-ended`: Remote user ended call
- `user-logged-out`: Other user logged out

## Permissions

### Android (`app.json`)

```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "RECORD_AUDIO",
      "MODIFY_AUDIO_SETTINGS",
      "ACCESS_NETWORK_STATE",
      "INTERNET"
    ]
  }
}
```

### iOS (`app.json`)

```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app needs access to your camera for video calls",
      "NSMicrophoneUsageDescription": "This app needs access to your microphone for voice and video calls"
    }
  }
}
```

## Dependencies

```json
{
  "react-native-webrtc": "^118.0.0",
  "react-native-incall-manager": "^4.0.1"
}
```

## Configuration

### ICE Servers (STUN/TURN)

Located in `webrtcService`:

```typescript
private iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};
```

**Note**: For production, replace with your own TURN servers for better reliability.

## Testing

### Prerequisites

1. Two devices (or one device + one web browser)
2. Both users logged in
3. Camera and microphone permissions granted
4. Network connectivity

### Test Scenarios

#### 1. Voice Call (Mobile → Web)
1. Open private chat with web user
2. Click phone icon
3. Wait for web user to accept
4. Verify audio quality
5. Test mute/unmute
6. Test speaker toggle
7. End call

#### 2. Video Call (Mobile → Mobile)
1. Open private chat with another mobile user
2. Click video icon
3. Wait for acceptance
4. Verify video rendering
5. Test camera on/off
6. Test camera flip
7. Test mute
8. End call

#### 3. Incoming Call
1. Have another user call you
2. Verify incoming call dialog appears
3. Test decline
4. Have them call again
5. Test accept
6. Verify connection establishes

#### 4. Call Rejection
1. Initiate call
2. Have receiver decline
3. Verify proper error handling
4. Verify UI returns to normal

#### 5. Network Interruption
1. Start a call
2. Disable network briefly
3. Re-enable network
4. Verify reconnection or proper error

## Troubleshooting

### No Audio

**Issue**: Can't hear other person

**Solutions**:
- Check microphone permissions
- Verify speaker is enabled
- Check device volume
- Restart app

### No Video

**Issue**: Video not showing

**Solutions**:
- Check camera permissions
- Verify camera is not off
- Try switching camera
- Check if other apps are using camera
- Restart app

### Connection Failed

**Issue**: Call doesn't connect

**Solutions**:
- Check internet connection
- Verify both users are online
- Check firewall settings
- Try different network (WiFi/Mobile data)
- Verify TURN server is accessible

### One-Way Audio/Video

**Issue**: Can hear them but they can't hear you (or vice versa)

**Solutions**:
- Check WebRTC offer/answer exchange
- Verify ICE candidates are being exchanged
- Check NAT/firewall settings
- Use TURN server instead of STUN only

## Performance Optimization

### Video Quality

- Default resolution: 640x480 @ 30fps
- Adjustable in `getUserMedia` constraints
- Lower for better performance on older devices

### Audio Quality

- Echo cancellation: Enabled
- Noise suppression: Enabled
- Auto gain control: Enabled

### Network Adaptation

- WebRTC automatically adapts to network conditions
- Switches between codecs based on bandwidth
- Reduces quality if network is poor

## Security

### Encryption

- All WebRTC connections use DTLS-SRTP encryption
- End-to-end encrypted audio/video streams
- Signaling through secure Socket.IO connection

### Permissions

- Camera/microphone access requested at call time
- User can revoke permissions in device settings
- App handles permission denial gracefully

## Future Enhancements

### Planned Features

- [ ] Group video calls
- [ ] Screen sharing
- [ ] Call recording
- [ ] Call history with logs
- [ ] Push notifications for missed calls
- [ ] Background call support
- [ ] Picture-in-picture mode
- [ ] Bandwidth monitoring
- [ ] Connection quality indicator

### UI Improvements

- [ ] Avatar animations during voice calls
- [ ] Network quality indicator
- [ ] Better error messages
- [ ] Call statistics overlay
- [ ] Vibration on incoming call

## Support

For issues or questions:
- Check console logs for WebRTC errors
- Verify socket connection is active
- Test with different network conditions
- Ensure all permissions are granted

## Resources

- [WebRTC Docs](https://webrtc.org/getting-started/overview)
- [React Native WebRTC](https://github.com/react-native-webrtc/react-native-webrtc)
- [InCallManager](https://github.com/react-native-webrtc/react-native-incall-manager)
