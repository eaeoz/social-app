import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
  RTCView,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { Socket } from 'socket.io-client';

export interface CallConfig {
  socket: Socket;
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string | null;
}

export interface CallUser {
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string | null;
}

export type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
export type CallType = 'voice' | 'video';

export interface CallEvent {
  type: 'state-change' | 'local-stream' | 'remote-stream' | 'error' | 'duration';
  state?: CallState;
  stream?: MediaStream;
  error?: string;
  duration?: number;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket | null = null;
  private callType: CallType = 'voice';
  private isInitiator: boolean = false;
  private callState: CallState = 'idle';
  private otherUser: CallUser | null = null;
  private callStartTime: number | null = null;
  private durationInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(event: CallEvent) => void>> = new Map();
  private pendingCandidates: any[] = [];
  private isProcessingOffer: boolean = false;

  // ICE servers configuration for NAT traversal
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

  constructor() {
    console.log('📞 WebRTC Service initialized');
  }

  // Event emitter methods
  on(event: string, callback: (event: CallEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (event: CallEvent) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: CallEvent): void {
    const callbacks = this.listeners.get('*');
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }
  }

  private setState(state: CallState): void {
    this.callState = state;
    this.emit({ type: 'state-change', state });
    console.log('📱 Call state changed:', state);
  }

  // Initialize call (for outgoing calls)
  async initiateCall(
    config: CallConfig,
    otherUser: CallUser,
    callType: CallType
  ): Promise<void> {
    try {
      console.log('📤 Initiating call to:', otherUser.username, 'Type:', callType);
      
      this.socket = config.socket;
      this.otherUser = otherUser;
      this.callType = callType;
      this.isInitiator = true;
      this.setState('ringing');

      // Start ringing sound for outgoing call
      InCallManager.start({ media: 'audio', ringback: '_BUNDLE_' });

      // Get user media
      await this.getUserMedia();

      // Setup peer connection
      await this.setupPeerConnection();

      // Setup socket listeners
      this.setupSocketListeners();

      // Emit initiate-call event
      this.socket.emit('initiate-call', {
        to: otherUser.userId,
        from: config.userId,
        fromName: config.displayName || config.username,
        fromPicture: config.profilePicture,
        callType,
      });

      console.log('✅ Call initiated successfully');
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      this.emit({ type: 'error', error: 'Failed to initiate call' });
      this.cleanup();
      throw error;
    }
  }

  // Accept incoming call
  async acceptCall(
    config: CallConfig,
    caller: CallUser,
    callType: CallType
  ): Promise<void> {
    try {
      console.log('📥 Accepting call from:', caller.username, 'Type:', callType);
      
      this.socket = config.socket;
      this.otherUser = caller;
      this.callType = callType;
      this.isInitiator = false;
      this.setState('connecting');

      // Stop ringing and start call
      InCallManager.stopRingback();
      InCallManager.start({ media: 'audio' });

      // Get user media
      await this.getUserMedia();

      // Setup peer connection
      await this.setupPeerConnection();

      // Setup socket listeners
      this.setupSocketListeners();

      // Emit call-accepted event
      this.socket.emit('call-accepted', {
        to: caller.userId,
      });

      console.log('✅ Call accepted successfully');
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      this.emit({ type: 'error', error: 'Failed to accept call' });
      this.cleanup();
      throw error;
    }
  }

  // Reject incoming call
  rejectCall(callerId: string): void {
    if (this.socket) {
      this.socket.emit('call-rejected', { to: callerId });
      InCallManager.stop();
    }
    this.cleanup();
  }

  // Get user media (camera/microphone)
  private async getUserMedia(): Promise<void> {
    try {
      const constraints: any = {
        audio: true,
        video: this.callType === 'video' ? {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
        } : false,
      };

      this.localStream = await mediaDevices.getUserMedia(constraints);
      
      console.log('📷 Got local media stream');
      console.log('Tracks:', this.localStream.getTracks().map(t => `${t.kind} (${t.enabled})`));

      this.emit({ type: 'local-stream', stream: this.localStream });
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  // Setup peer connection
  private async setupPeerConnection(): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection(this.iceServers);

      // Add local stream tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
          console.log('✅ Added local track:', track.kind);
        });
      }

      // Handle remote stream
      this.peerConnection.addEventListener('track', (event: any) => {
        console.log('📹 Received remote track:', event.track.kind);
        
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          console.log('✅ Remote stream received');
          this.emit({ type: 'remote-stream', stream: this.remoteStream });

          if (this.callState !== 'connected') {
            this.setState('connected');
            this.startCallTimer();
          }
        }
      });

      // Handle ICE candidates
      this.peerConnection.addEventListener('icecandidate', (event: any) => {
        if (event.candidate && this.socket) {
          console.log('🧊 Sending ICE candidate');
          this.socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: this.otherUser?.userId,
          });
        }
      });

      // Handle connection state changes
      this.peerConnection.addEventListener('connectionstatechange', () => {
        const state = this.peerConnection?.connectionState;
        console.log('🔌 Connection state:', state);

        if (state === 'connected') {
          this.setState('connected');
          this.startCallTimer();
          InCallManager.setKeepScreenOn(true);
        } else if (state === 'failed') {
          console.error('❌ Connection failed');
          this.emit({ type: 'error', error: 'Connection failed' });
          this.endCall();
        } else if (state === 'closed') {
          console.log('🔌 Connection closed');
        }
      });

      console.log('✅ Peer connection setup complete');
    } catch (error) {
      console.error('❌ Error setting up peer connection:', error);
      throw error;
    }
  }

  // Setup socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Call accepted (initiator only)
    if (this.isInitiator) {
      this.socket.on('call-accepted', this.handleCallAccepted.bind(this));
    }

    // Call rejected
    this.socket.on('call-rejected', this.handleCallRejected.bind(this));

    // Call cancelled
    this.socket.on('call-cancelled', this.handleCallCancelled.bind(this));

    // WebRTC signaling
    this.socket.on('call-offer', this.handleCallOffer.bind(this));
    this.socket.on('call-answer', this.handleCallAnswer.bind(this));
    this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));

    // Call ended
    this.socket.on('call-ended', this.handleRemoteCallEnd.bind(this));

    // User logged out
    this.socket.on('user-logged-out', this.handleUserLoggedOut.bind(this));
  }

  // Handle call accepted (initiator only)
  private async handleCallAccepted(): Promise<void> {
    try {
      console.log('✅ Call accepted by receiver');
      
      // Stop ringback tone
      InCallManager.stopRingback();
      InCallManager.start({ media: 'audio' });
      
      this.setState('connecting');

      if (this.peerConnection) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socket?.emit('call-offer', {
          offer,
          to: this.otherUser?.userId,
          callType: this.callType,
        });

        console.log('📤 Offer sent to receiver');
      }
    } catch (error) {
      console.error('❌ Error handling call accepted:', error);
      this.emit({ type: 'error', error: 'Failed to establish connection' });
    }
  }

  // Handle call rejected
  private handleCallRejected(): void {
    console.log('❌ Call rejected');
    this.emit({ type: 'error', error: 'Call was declined' });
    this.endCall();
  }

  // Handle call cancelled
  private handleCallCancelled(): void {
    console.log('🚫 Call cancelled by caller');
    this.emit({ type: 'error', error: 'Call was cancelled' });
    this.cleanup();
  }

  // Handle call offer (receiver only)
  private async handleCallOffer(data: { offer: any }): Promise<void> {
    try {
      console.log('📥 Received call offer');

      if (this.isProcessingOffer) {
        console.log('⚠️ Already processing offer, ignoring duplicate');
        return;
      }

      if (!this.peerConnection) {
        console.error('❌ Peer connection not ready');
        return;
      }

      if (this.peerConnection.remoteDescription || this.peerConnection.localDescription) {
        console.log('⚠️ Offer already processed');
        return;
      }

      this.isProcessingOffer = true;

      await this.peerConnection.setRemoteDescription(data.offer);
      console.log('✅ Remote description set');

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created');

      this.socket?.emit('call-answer', {
        answer,
        to: this.otherUser?.userId,
      });
      console.log('📤 Answer sent');

      // Process any pending ICE candidates
      if (this.pendingCandidates.length > 0) {
        console.log(`🧊 Processing ${this.pendingCandidates.length} pending ICE candidates`);
        for (const candidate of this.pendingCandidates) {
          try {
            await this.peerConnection.addIceCandidate(candidate);
          } catch (error) {
            console.error('Error adding queued ICE candidate:', error);
          }
        }
        this.pendingCandidates = [];
      }
    } catch (error) {
      console.error('❌ Error handling call offer:', error);
      this.emit({ type: 'error', error: 'Failed to establish connection' });
      this.isProcessingOffer = false;
    }
  }

  // Handle call answer (initiator only)
  private async handleCallAnswer(data: { answer: any }): Promise<void> {
    try {
      console.log('📥 Received call answer');

      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(data.answer);
        console.log('✅ Remote description set from answer');
      }
    } catch (error) {
      console.error('❌ Error handling call answer:', error);
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(data: { candidate: any }): Promise<void> {
    try {
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(data.candidate);
        console.log('🧊 ICE candidate added');
      } else {
        // Queue candidate if remote description not set yet
        if (this.pendingCandidates.length < 50) {
          this.pendingCandidates.push(data.candidate);
        }
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  // Handle remote call end
  private handleRemoteCallEnd(): void {
    console.log('📞 Remote user ended the call');
    this.endCall();
  }

  // Handle user logged out
  private handleUserLoggedOut(data: { userId: string; reason: string }): void {
    if (data.userId === this.otherUser?.userId) {
      console.log(`🚪 ${this.otherUser.username} logged out (${data.reason})`);
      this.emit({ 
        type: 'error', 
        error: `${this.otherUser.username} has ${data.reason === 'session-expired' ? 'been logged out due to inactivity' : 'logged out'}` 
      });
      this.endCall();
    }
  }

  // Start call duration timer
  private startCallTimer(): void {
    if (this.callStartTime) {
      return; // Already started
    }

    console.log('⏱️ Starting call timer');
    this.callStartTime = Date.now();

    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.emit({ type: 'duration', duration });
      }
    }, 1000);
  }

  // Toggle mute
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('🔇 Mute toggled:', !audioTrack.enabled);
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle camera
  toggleCamera(): boolean {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('📹 Camera toggled:', !videoTrack.enabled);
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<void> {
    if (this.localStream && this.callType === 'video') {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - _switchCamera is available on React Native WebRTC
        videoTrack._switchCamera();
        console.log('🔄 Camera switched');
      }
    }
  }

  // Toggle speaker
  toggleSpeaker(enabled: boolean): void {
    InCallManager.setForceSpeakerphoneOn(enabled);
    console.log('🔊 Speaker:', enabled ? 'ON' : 'OFF');
  }

  // End call
  endCall(): void {
    const currentState = this.callState;
    
    if (this.socket && currentState !== 'ended') {
      this.socket.emit('end-call', {
        to: this.otherUser?.userId,
        callState: currentState,
      });

      // Send call log
      if (this.callStartTime && currentState === 'connected') {
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.socket.emit('call-ended-log', {
          receiverId: this.otherUser?.userId,
          callType: this.callType,
          duration,
          callStatus: 'completed',
        });
      } else if (currentState === 'ringing') {
        this.socket.emit('call-ended-log', {
          receiverId: this.otherUser?.userId,
          callType: this.callType,
          duration: 0,
          callStatus: this.isInitiator ? 'cancelled' : 'missed',
        });
      }
    }

    this.cleanup();
    this.setState('ended');
  }

  // Cleanup resources
  private cleanup(): void {
    console.log('🧹 Cleaning up WebRTC resources');

    // Stop call timer
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop InCallManager
    InCallManager.stop();
    InCallManager.setKeepScreenOn(false);

    // Remove socket listeners
    if (this.socket) {
      this.socket.off('call-accepted');
      this.socket.off('call-rejected');
      this.socket.off('call-cancelled');
      this.socket.off('call-offer');
      this.socket.off('call-answer');
      this.socket.off('ice-candidate');
      this.socket.off('call-ended');
      this.socket.off('user-logged-out');
    }

    // Reset state
    this.socket = null;
    this.otherUser = null;
    this.callStartTime = null;
    this.pendingCandidates = [];
    this.isProcessingOffer = false;
    this.remoteStream = null;

    console.log('✅ Cleanup complete');
  }

  // Get current state
  getState(): CallState {
    return this.callState;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Get call type
  getCallType(): CallType {
    return this.callType;
  }

  // Get other user
  getOtherUser(): CallUser | null {
    return this.otherUser;
  }

  // Check if initiator
  isCallInitiator(): boolean {
    return this.isInitiator;
  }
}

export const webrtcService = new WebRTCService();
