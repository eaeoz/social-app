# Mobile App Voice/Video Calling Implementation Plan

## Overview
Implementing WebRTC-based voice and video calling for React Native mobile app, with full compatibility with web frontend.

## Required Packages

```bash
npm install react-native-webrtc
npm install @react-native-community/async-storage
npm install react-native-incall-manager  # For managing calls
```

## Implementation Steps

### Phase 1: Call UI Components ✅ (Current Phase)
1. Add call buttons to PrivateChatScreen header
2. Create CallScreen component for active calls
3. Create IncomingCallModal for call notifications
4. Add call state management

### Phase 2: WebRTC Service
1. Create WebRTC service for managing peer connections
2. Implement ICE candidate handling
3. Add offer/answer creation and handling
4. Manage media streams (audio/video)

### Phase 3: Socket Integration
1. Add call signaling event listeners
2. Implement call initiation
3. Handle incoming calls
4. Manage call state transitions

### Phase 4: Call Screen Features
1. Mute/unmute audio
2. Toggle video (camera on/off)
3. Switch camera (front/back)
4. End call functionality
5. Call duration timer
6. Connection quality indicator

### Phase 5: Advanced Features (Optional)
1. Whiteboard integration (using react-native-sketch-canvas)
2. Screen sharing (limited on mobile)
3. Call logs/history
4. Call notifications with react-native-push-notification

## Architecture

```
PrivateChatScreen
├── Call Buttons (Voice/Video)
├── IncomingCallModal (When receiving call)
└── CallScreen (When in active call)
    ├── Video Views (Local + Remote)
    ├── Control Buttons (Mute, Video, End, Camera Switch)
    ├── Call Timer
    └── Whiteboard Button (optional)
```

## Socket Events (Already Implemented in Backend)

### Outgoing:
- `initiate-call` - Start a call
- `call-accepted` - Accept incoming call
- `call-rejected` - Decline incoming call
- `call-offer` - Send WebRTC offer
- `call-answer` - Send WebRTC answer
- `ice-candidate` - Exchange ICE candidates
- `end-call` - End the call
- `call-ended-log` - Log call duration

### Incoming:
- `incoming-call` - Receive call notification
- `call-accepted` - Call was accepted
- `call-rejected` - Call was declined
- `call-offer` - Receive WebRTC offer
- `call-answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `call-ended` - Call ended by other user

## Current Status
✅ Backend socket handlers ready
✅ Web implementation complete
🔄 Starting mobile implementation
⏳ Package installation needed
⏳ Components to be created
⏳ WebRTC service to be built

## Next Steps
1. Install required packages
2. Add call buttons to PrivateChatScreen
3. Create CallScreen component
4. Implement WebRTC service
5. Test calling between mobile-mobile and mobile-web

## Notes
- WebRTC requires HTTPS in production
- iOS requires camera/microphone permissions in Info.plist
- Android requires permissions in AndroidManifest.xml
- Test on real devices (WebRTC doesn't work well in simulators)
