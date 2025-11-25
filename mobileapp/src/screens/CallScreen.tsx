import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Text, Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { RTCView } from 'react-native-webrtc';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { webrtcService, CallState, CallEvent } from '../services/webrtc.service';
import { socketService } from '../services';
import { useAuthStore } from '../store';

type CallScreenRouteProp = RouteProp<{
  Call: {
    callType: 'voice' | 'video';
    otherUser: {
      userId: string;
      username: string;
      displayName?: string;
      profilePicture?: string | null;
    };
    isIncoming?: boolean;
  };
}, 'Call'>;

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const theme = useTheme();
  const route = useRoute<CallScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const { callType, otherUser, isIncoming = false } = route.params;
  
  const [callState, setCallState] = useState<CallState>('ringing');
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('📞 Call screen mounted:', { callType, isIncoming, otherUser: otherUser.username });
    
    // Initialize call
    initializeCall();

    // Listen for call events
    const handleCallEvent = (event: CallEvent) => {
      console.log('📱 Call event:', event.type, event);
      
      switch (event.type) {
        case 'state-change':
          if (event.state) {
            setCallState(event.state);
            if (event.state === 'ended') {
              setTimeout(() => {
                navigation.goBack();
              }, 1000);
            }
          }
          break;
        
        case 'local-stream':
          if (event.stream) {
            setLocalStream(event.stream);
          }
          break;
        
        case 'remote-stream':
          if (event.stream) {
            setRemoteStream(event.stream);
          }
          break;
        
        case 'error':
          if (event.error) {
            setError(event.error);
            setTimeout(() => {
              webrtcService.endCall();
            }, 3000);
          }
          break;
        
        case 'duration':
          if (event.duration !== undefined) {
            setCallDuration(event.duration);
          }
          break;
      }
    };

    webrtcService.on('*', handleCallEvent);

    return () => {
      console.log('📞 Call screen unmounting');
      webrtcService.off('*', handleCallEvent);
      
      // End call if still active
      if (webrtcService.getState() !== 'ended') {
        webrtcService.endCall();
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      const socket = socketService.isConnected() ? (socketService as any).socket : null;
      
      if (!socket) {
        setError('No connection available');
        return;
      }

      if (!user) {
        setError('User not authenticated');
        return;
      }

      const config = {
        socket,
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
      };

      if (isIncoming) {
        // Accept incoming call
        await webrtcService.acceptCall(config, otherUser, callType);
      } else {
        // Initiate outgoing call
        await webrtcService.initiateCall(config, otherUser, callType);
      }
    } catch (error: any) {
      console.error('❌ Error initializing call:', error);
      setError(error.message || 'Failed to initialize call');
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall();
  };

  const handleToggleMute = () => {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleCamera = () => {
    const cameraOff = webrtcService.toggleCamera();
    setIsCameraOff(cameraOff);
  };

  const handleSwitchCamera = () => {
    webrtcService.switchCamera();
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    webrtcService.toggleSpeaker(newSpeakerState);
    setIsSpeakerOn(newSpeakerState);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (error) return error;
    
    switch (callState) {
      case 'ringing':
        return isIncoming ? 'Connecting...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Remote video or avatar */}
      <View style={styles.videoContainer}>
        {callType === 'video' && remoteStream && callState === 'connected' ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            zOrder={0}
          />
        ) : (
          <View style={styles.avatarContainer}>
            {otherUser.profilePicture ? (
              <Avatar.Image
                size={120}
                source={{ uri: otherUser.profilePicture }}
              />
            ) : (
              <Avatar.Text
                size={120}
                label={(otherUser.displayName || otherUser.username).substring(0, 2).toUpperCase()}
              />
            )}
          </View>
        )}
        
        {/* Local video preview */}
        {callType === 'video' && localStream && callState !== 'ringing' && (
          <View style={styles.localVideoContainer}>
            {!isCameraOff ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
                zOrder={1}
                mirror={true}
              />
            ) : (
              <View style={[styles.localVideo, styles.cameraOffContainer]}>
                <Text style={styles.cameraOffText}>📷 Off</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Call info */}
      <View style={styles.infoContainer}>
        <Text variant="headlineMedium" style={styles.userName}>
          {otherUser.displayName || otherUser.username}
        </Text>
        <Text variant="bodyLarge" style={styles.statusText}>
          {getStatusText()}
        </Text>
        {callState === 'ringing' && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 8 }} />
        )}
      </View>

      {/* Call controls */}
      <View style={styles.controlsContainer}>
        {callState !== 'ringing' && callState !== 'ended' ? (
          <View style={styles.controlsRow}>
            {/* Mute button */}
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={handleToggleMute}
            >
              <IconButton
                icon={isMuted ? 'microphone-off' : 'microphone'}
                size={32}
                iconColor="#fff"
              />
              <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            {/* Speaker button (voice calls) */}
            {callType === 'voice' && (
              <TouchableOpacity
                style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
                onPress={handleToggleSpeaker}
              >
                <IconButton
                  icon={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={32}
                  iconColor="#fff"
                />
                <Text style={styles.controlLabel}>Speaker</Text>
              </TouchableOpacity>
            )}

            {/* Camera controls (video calls) */}
            {callType === 'video' && (
              <>
                <TouchableOpacity
                  style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                  onPress={handleToggleCamera}
                >
                  <IconButton
                    icon={isCameraOff ? 'video-off' : 'video'}
                    size={32}
                    iconColor="#fff"
                  />
                  <Text style={styles.controlLabel}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleSwitchCamera}
                >
                  <IconButton
                    icon="camera-flip"
                    size={32}
                    iconColor="#fff"
                  />
                  <Text style={styles.controlLabel}>Flip</Text>
                </TouchableOpacity>
              </>
            )}

            {/* End call button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleEndCall}
            >
              <IconButton
                icon="phone-hangup"
                size={32}
                iconColor="#fff"
              />
              <Text style={styles.controlLabel}>End</Text>
            </TouchableOpacity>
          </View>
        ) : callState === 'ringing' ? (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleEndCall}
            >
              <IconButton
                icon="phone-hangup"
                size={32}
                iconColor="#fff"
              />
              <Text style={styles.controlLabel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  cameraOffContainer: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffText: {
    color: '#fff',
    fontSize: 14,
  },
  infoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusText: {
    color: '#fff',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 80,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  endCallButton: {
    backgroundColor: '#ef4444',
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
