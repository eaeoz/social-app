import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RoomsScreen, ChatsScreen, UsersScreen, ProfileScreen } from '../screens';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{
          title: 'Chat Rooms',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="forum" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
