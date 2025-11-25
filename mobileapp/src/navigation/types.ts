import { NavigationProp, RouteProp } from '@react-navigation/native';
import { Room, PrivateChat, User } from '../types';

// Auth Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Rooms: undefined;
  Chats: undefined;
  Users: undefined;
  Profile: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChatRoom: { room: Room };
  PrivateChat: { chat: PrivateChat };
  UserProfile: { user: User };
  EditProfile: undefined;
  ChangePassword: undefined;
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
};

// Navigation props
export type AuthNavigationProp = NavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = NavigationProp<MainTabParamList>;
export type RootNavigationProp = NavigationProp<RootStackParamList>;

// Route props
export type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
export type PrivateChatRouteProp = RouteProp<RootStackParamList, 'PrivateChat'>;
export type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
export type CallRouteProp = RouteProp<RootStackParamList, 'Call'>;
