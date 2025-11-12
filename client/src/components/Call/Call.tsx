import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import './Call.css';

interface CallProps {
  socket: Socket | null;
  otherUser: {
    userId: string;
    username: string;
    nickName: string;
    profilePicture?: string | null;
  };
  callType: 'voice' | 'video';
  isInitiator: boolean;
  onCallEnd: () => void;
}

function Call({ socket, otherUser, callType, isInitiator, onCallEnd }: CallProps) {
  const [callState, setCallState] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const isProcessingOfferRef = useRef<boolean>(false); // NEW: Prevent duplicate offer processing
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const MAX_PENDING_CANDIDATES = 50; // Limit queued candidates

  // ICE servers configuration for better connectivity across networks
  // Using both STUN (for NAT discovery) and TURN servers (for relaying when direct connection fails)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Free public TURN server for when STUN isn't enough
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  useEffect(() => {
    // Prevent double initialization (React Strict Mode)
    if (isMountedRef.current) {
      console.log('⚠️ Component already mounted, skipping initialization');
      return;
    }
    
    console.log('🚀 Call component mounted with props:', {
      hasSocket: !!socket,
      callType,
      isInitiator,
      otherUserId: otherUser.userId
    });
    isMountedRef.current = true;
    initializeCall();

    if (socket) {
      // Only initiator should listen to call-accepted
      if (isInitiator) {
        socket.on('call-accepted', handleCallAccepted);
      }
      socket.on('call-rejected', handleCallRejected);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('call-offer', handleCallOffer);
      socket.on('call-answer', handleCallAnswer);
      socket.on('call-ended', handleRemoteCallEnd);
      socket.on('user-logged-out', handleUserLoggedOut);
    }

    return () => {
      console.log('🔥 Call component unmounting - cleaning up');
      isMountedRef.current = false;
      isInitializedRef.current = false;
      isProcessingOfferRef.current = false; // Reset processing flag
      pendingOfferRef.current = null;
      pendingCandidatesRef.current = []; // Clear candidate queue on unmount
      cleanup();
      if (socket) {
        if (isInitiator) {
          socket.off('call-accepted', handleCallAccepted);
        }
        socket.off('call-rejected', handleCallRejected);
        socket.off('ice-candidate', handleIceCandidate);
        socket.off('call-offer', handleCallOffer);
        socket.off('call-answer', handleCallAnswer);
        socket.off('call-ended', handleRemoteCallEnd);
        socket.off('user-logged-out', handleUserLoggedOut);
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media with mobile-friendly constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      console.log('📷 Got local media stream with tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`));
      
      // Log detailed track info
      stream.getTracks().forEach(track => {
        console.log(`📹 Track details - Kind: ${track.kind}, ID: ${track.id}, Label: ${track.label}, Ready: ${track.readyState}, Muted: ${track.muted}`);
      });

      // Set local video stream when element is available (will be set again when state changes if needed)
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before playing
        localVideoRef.current.onloadedmetadata = () => {
          console.log('📺 Local video metadata loaded, dimensions:', localVideoRef.current?.videoWidth, 'x', localVideoRef.current?.videoHeight);
          localVideoRef.current?.play().catch(err => console.error('Error playing local video:', err));
        };
        
        // Also try playing immediately
        localVideoRef.current.play().catch(err => console.error('Error playing local video:', err));
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(iceServers);

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        const sender = peerConnectionRef.current?.addTrack(track, stream);
        console.log('✅ Added local track to peer connection:', track.kind, 'Sender:', sender?.track?.kind);
      });

      console.log('📊 Peer connection senders:', peerConnectionRef.current.getSenders().length);

      // Handle incoming stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('📹 Received remote track:', event.track.kind, 'Stream ID:', event.streams[0]?.id, 'Track state:', event.track.readyState);
        
        if (event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log('📊 Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'}, ${t.readyState})`));
          
          // For video calls, use video element
          if (callType === 'video' && remoteVideoRef.current) {
            const currentSrcObject = remoteVideoRef.current.srcObject as MediaStream | null;
            
            // Check if we need to update the stream (new stream or additional tracks)
            const needsUpdate = !currentSrcObject || 
                               currentSrcObject.id !== remoteStream.id ||
                               currentSrcObject.getTracks().length < remoteStream.getTracks().length;
            
            if (needsUpdate) {
              console.log('✅ Setting/updating remote stream to video element');
              remoteVideoRef.current.srcObject = remoteStream;
              
              // Wait for the video element to be ready before playing
              remoteVideoRef.current.onloadedmetadata = () => {
                console.log('📺 Remote video metadata loaded');
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.play().catch(err => {
                    console.error('Error playing remote video after metadata loaded:', err);
                    // Retry once after a short delay
                    setTimeout(() => {
                      remoteVideoRef.current?.play().catch(retryErr => {
                        console.error('Error on retry playing remote video:', retryErr);
                      });
                    }, 500);
                  });
                }
              };
              
              // Also try playing immediately in case metadata is already loaded
              remoteVideoRef.current.play().catch(err => {
                console.log('Initial play attempt failed (expected if metadata not loaded yet):', err.message);
              });
            } else {
              console.log('📺 Remote stream already set with same tracks, skipping update');
            }
          }
          
          // For voice calls, use audio element
          if (callType === 'voice' && remoteAudioRef.current) {
            const currentSrcObject = remoteAudioRef.current.srcObject as MediaStream | null;
            
            // Check if we need to update the stream
            const needsUpdate = !currentSrcObject || 
                               currentSrcObject.id !== remoteStream.id ||
                               currentSrcObject.getTracks().length < remoteStream.getTracks().length;
            
            if (needsUpdate) {
              console.log('✅ Setting/updating remote stream to audio element');
              remoteAudioRef.current.srcObject = remoteStream;
              
              // Wait for the audio element to be ready before playing
              remoteAudioRef.current.onloadedmetadata = () => {
                console.log('🔊 Remote audio metadata loaded');
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.play().catch(err => {
                    console.error('Error playing remote audio after metadata loaded:', err);
                    // Retry once after a short delay
                    setTimeout(() => {
                      remoteAudioRef.current?.play().catch(retryErr => {
                        console.error('Error on retry playing remote audio:', retryErr);
                      });
                    }, 500);
                  });
                }
              };
              
              // Also try playing immediately
              remoteAudioRef.current.play().catch(err => {
                console.log('Initial audio play attempt failed (expected if metadata not loaded yet):', err.message);
              });
            } else {
              console.log('🔊 Remote audio already set with same tracks, skipping update');
            }
          }
          
          // Only set connected and start timer once
          if (callState !== 'connected') {
            setCallState('connected');
            startCallTimer();
          }
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('🧊 Sending ICE candidate');
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: otherUser.userId
          });
        }
      };

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        console.log('🔌 Connection state:', state);
        if (state === 'connected') {
          console.log('✅ Peer connection established!');
          setCallState('connected');
          startCallTimer();
        } else if (state === 'failed') {
          console.error('❌ Connection failed');
          setError('Connection failed');
          setTimeout(() => endCall(), 2000);
        } else if (state === 'closed') {
          console.log('� Connection closed');
          // Don't call endCall() here - it's already closed
        } else if (state === 'disconnected') {
          console.warn('⚠️ Connection disconnected');
          // Don't immediately end - might reconnect
        }
      };

      // Don't send offer yet if initiator - wait for call-accepted event
      console.log('✅ Media and peer connection initialized. Is initiator:', isInitiator);
      isInitializedRef.current = true;
      
      // Process any pending offer that arrived before initialization
      if (pendingOfferRef.current) {
        console.log('📥 Processing pending offer that arrived early');
        handleCallOffer({ offer: pendingOfferRef.current });
        pendingOfferRef.current = null;
      }
      
      // Process any pending ICE candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`📥 Processing ${pendingCandidatesRef.current.length} pending ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          handleIceCandidate({ candidate });
        }
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      console.error('Error initializing call:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      setTimeout(() => endCall(), 3000);
    }
  };

  const handleCallAccepted = async () => {
    try {
      console.log('✅ Call accepted! Is initiator:', isInitiator, 'Initialized:', isInitializedRef.current);
      
      // Only initiator should process this
      if (!isInitiator) {
        console.log('⚠️ Receiver should not process call-accepted event');
        return;
      }
      
      setCallState('connecting');
      
      // Wait for initialization if not ready yet
      if (!isInitializedRef.current) {
        console.log('⏳ Waiting for initialization before sending offer...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkInterval = setInterval(async () => {
          attempts++;
          console.log(`⏳ Waiting... attempt ${attempts}/${maxAttempts}`);
          
          if (isInitializedRef.current && peerConnectionRef.current) {
            clearInterval(checkInterval);
            console.log('📤 Now ready - creating and sending offer...');
            try {
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              
              if (socket) {
                socket.emit('call-offer', {
                  offer,
                  to: otherUser.userId,
                  callType
                });
                console.log('✅ Offer sent successfully');
              }
            } catch (error) {
              console.error('❌ Error creating/sending offer:', error);
              setError('Failed to establish connection');
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Timeout waiting for initialization');
            setError('Connection timeout');
            setTimeout(() => endCall(), 2000);
          }
        }, 100);
        return;
      }
      
      // If already initialized, send offer immediately
      if (peerConnectionRef.current && socket) {
        console.log('📤 Creating and sending offer immediately...');
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          
          socket.emit('call-offer', {
            offer,
            to: otherUser.userId,
            callType
          });
          console.log('✅ Offer sent successfully');
        } catch (error) {
          console.error('❌ Error creating/sending offer:', error);
          setError('Failed to establish connection');
        }
      } else {
        console.error('❌ peerConnection or socket is null');
        setError('Connection failed');
      }
    } catch (err) {
      console.error('❌ Error in handleCallAccepted:', err);
      setError('Failed to accept call');
    }
  };

  const handleCallRejected = () => {
    setError('Call was declined');
    setTimeout(() => endCall(), 2000);
  };

  const handleCallOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
    try {
      console.log('📥 Received call offer. Initialized:', isInitializedRef.current, 'Processing:', isProcessingOfferRef.current);
      
      // CRITICAL: Check if already processing to prevent double execution
      if (isProcessingOfferRef.current) {
        console.log('⚠️ Already processing an offer, ignoring duplicate');
        return;
      }
      
      // If not initialized yet, queue the offer
      if (!isInitializedRef.current) {
        console.log('⏳ Queueing offer until initialization completes');
        pendingOfferRef.current = offer;
        return;
      }
      
      if (!peerConnectionRef.current) {
        console.error('❌ peerConnectionRef.current is null!');
        setError('Connection error');
        return;
      }
      
      // Check if we already have remote description OR local description (already processing/processed)
      if (peerConnectionRef.current.remoteDescription || peerConnectionRef.current.localDescription) {
        console.log('⚠️ Offer already processed, ignoring duplicate');
        return;
      }
      
      // Set processing flag BEFORE any async operations
      isProcessingOfferRef.current = true;
      
      console.log('📝 Setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set successfully');
      
      console.log('🎯 Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      console.log('✅ Answer created successfully');
      
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ Local description set successfully');
      
      if (!socket) {
        console.error('❌ Socket is null!');
        setError('Connection error');
        return;
      }
      
      socket.emit('call-answer', {
        answer,
        to: otherUser.userId
      });
      console.log('📤 Answer sent to initiator');
      
      setCallState('connecting');
      
      // Process any pending ICE candidates now that we have remote description
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`🧊 Processing ${pendingCandidatesRef.current.length} queued ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Added queued ICE candidate');
          } catch (err) {
            console.error('❌ Error adding queued ICE candidate:', err);
          }
        }
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      console.error('❌ Error handling call offer:', err);
      setError('Failed to establish connection');
      isProcessingOfferRef.current = false; // Reset on error
    }
  };

  const handleCallAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
    try {
      console.log('📥 Received call answer');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('📝 Set remote description from answer');
      }
    } catch (err) {
      console.error('Error handling call answer:', err);
    }
  };

  const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    try {
      // If not initialized yet, queue the candidate (with limit)
      if (!isInitializedRef.current) {
        if (pendingCandidatesRef.current.length < MAX_PENDING_CANDIDATES) {
          pendingCandidatesRef.current.push(candidate);
        } else {
          console.warn(`⚠️ Candidate queue full (${MAX_PENDING_CANDIDATES}), dropping candidate`);
        }
        return;
      }
      
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('🧊 Added ICE candidate');
      } else {
        // Queue candidate if remote description not set yet (with limit)
        if (pendingCandidatesRef.current.length < MAX_PENDING_CANDIDATES) {
          pendingCandidatesRef.current.push(candidate);
        } else {
          console.warn(`⚠️ Candidate queue full (${MAX_PENDING_CANDIDATES}), dropping candidate`);
        }
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  };

  const handleRemoteCallEnd = () => {
    console.log('📞 Remote user ended the call');
    endCall();
  };

  const handleUserLoggedOut = ({ userId, reason }: { userId: string; reason: string }) => {
    // Check if the logged out user is the one we're in a call with
    if (userId === otherUser.userId) {
      console.log(`🚪 ${otherUser.nickName} logged out (${reason}) - ending call`);
      setError(`${otherUser.nickName} has ${reason === 'session-expired' ? 'been logged out due to inactivity' : 'logged out'}`);
      setTimeout(() => endCall(), 2000);
    }
  };

  const startCallTimer = () => {
    // Prevent starting timer multiple times
    if (callStartTimeRef.current) {
      console.log('⚠️ Timer already started, skipping');
      return;
    }
    
    console.log('⏱️ Starting call timer');
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        
        // Force video element to refresh when turning camera back on
        if (videoTrack.enabled && localVideoRef.current) {
          console.log('📹 Refreshing local video element');
          // Temporarily clear and reset srcObject to force refresh
          const currentStream = localVideoRef.current.srcObject;
          localVideoRef.current.srcObject = null;
          setTimeout(() => {
            if (localVideoRef.current && currentStream) {
              localVideoRef.current.srcObject = currentStream;
              localVideoRef.current.play().catch(err => console.error('Error replaying video:', err));
            }
          }, 10);
        }
      }
    }
  };

  const endCall = () => {
    if (socket && callState !== 'ended') {
      socket.emit('end-call', { to: otherUser.userId });
    }
    
    cleanup();
    setCallState('ended');
    
    // Send call log message
    if (socket && callStartTimeRef.current) {
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

  const cleanup = () => {
    console.log('Cleaning up call resources...');
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    console.log('Cleanup complete');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Effect to ensure local AND remote video gets streams when component renders
  useEffect(() => {
    // Set local video stream
    if (localVideoRef.current && localStreamRef.current && callType === 'video' && !localVideoRef.current.srcObject) {
      console.log('📹 Setting local video stream in effect');
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(err => console.error('Error playing local video in effect:', err));
    }
    
    // Set remote video stream if we already received it but element wasn't ready
    if (remoteVideoRef.current && callType === 'video' && !remoteVideoRef.current.srcObject && peerConnectionRef.current) {
      // Get all receiver tracks and create a MediaStream from them
      const receivers = peerConnectionRef.current.getReceivers();
      const tracks = receivers.map(receiver => receiver.track).filter(track => track !== null);
      
      if (tracks.length > 0) {
        console.log('📹 Setting remote video stream in effect (was received before element mounted)');
        const remoteStream = new MediaStream(tracks);
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => console.error('Error playing remote video in effect:', err));
      }
    }
  }, [callState, callType]); // Re-run when callState changes (e.g., ringing -> connecting)

  return (
    <div className="call-container">
      {/* Hidden audio element for voice calls */}
      {callType === 'voice' && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      )}
      
      {/* Remote video (or user picture during ringing) */}
      <div className="call-video-container">
        {callType === 'video' && callState !== 'ringing' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        ) : (
          <div className="call-avatar-container">
            {otherUser.profilePicture ? (
              <img src={otherUser.profilePicture} alt={otherUser.nickName} className="call-avatar-image" />
            ) : (
              <div className="call-avatar-fallback">
                {otherUser.nickName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        
        {/* Local video preview for video calls */}
        {callType === 'video' && callState !== 'ringing' && (
          <div className="local-video-preview">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
              style={{ display: isCameraOff ? 'none' : 'block' }}
            />
            {isCameraOff && (
              <div className="camera-off-indicator">
                <span>📷</span>
                <span>Camera Off</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call info header */}
      <div className="call-header">
        <div className="call-info">
          <div className="call-user-name">{otherUser.nickName}</div>
          <div className="call-status">
            {callState === 'ringing' && (isInitiator ? 'Calling...' : 'Incoming call...')}
            {callState === 'connecting' && 'Connecting...'}
            {callState === 'connected' && formatDuration(callDuration)}
            {callState === 'ended' && 'Call ended'}
            {error && error}
          </div>
        </div>
      </div>

      {/* Call controls */}
      <div className="call-controls">
        {callState === 'ringing' ? (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', width: '100%' }}>
              {isInitiator ? 'Calling...' : 'Waiting for connection...'}
            </p>
            <button
              className="call-button call-button-hangup"
              onClick={endCall}
              aria-label="Cancel call"
            >
              <span className="button-icon">📞</span>
              <span className="button-label">Cancel</span>
            </button>
          </>
        ) : callState !== 'ended' ? (
          <>
            <button
              className={`call-button ${isMuted ? 'call-button-muted' : ''}`}
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                {isMuted ? (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                ) : (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                )}
              </svg>
              <span className="button-label">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            
            {callType === 'video' && (
              <button
                className={`call-button ${isCameraOff ? 'call-button-camera-off' : ''}`}
                onClick={toggleCamera}
                aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  {isCameraOff ? (
                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                  ) : (
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  )}
                </svg>
                <span className="button-label">{isCameraOff ? 'Camera On' : 'Camera Off'}</span>
              </button>
            )}
            
            <button
              className="call-button call-button-hangup"
              onClick={endCall}
              aria-label="End call"
            >
              <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              <span className="button-label">End</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default Call;
