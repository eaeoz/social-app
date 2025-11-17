# 📱 Netcify Mobile App

React Native mobile application for Netcify - A modern real-time chat and social platform.

## 🎯 Overview

This is the mobile version of the Netcify web application, built with:
- **Expo SDK 51+** - Modern React Native framework
- **TypeScript** - Type-safe development
- **React Native Paper** - Material Design UI components
- **Socket.IO** - Real-time communication
- **Zustand** - State management
- **AsyncStorage** - Local data persistence

## ✨ Features

### 🔐 Authentication
- Login and Register
- JWT-based authentication
- Auto token refresh
- Secure session management

### 💬 Messaging
- Public chat rooms
- Private messaging
- Real-time message delivery
- Typing indicators
- Read receipts
- Unread message badges

### 👤 User Profiles
- Profile pictures
- Display names (nicknames)
- Age and gender
- Online/offline status
- User search and filters

### 🔔 Notifications
- Push notifications (planned)
- In-app notifications
- Message alerts
- Sound and vibration

### 📸 Media Features
- Camera access for profile pictures
- Photo library access
- Image upload and cropping

### 🎨 UI/UX
- Dark and Light theme
- Material Design 3
- Smooth animations
- Responsive design
- Native feel

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: macOS with Xcode
- For Android: Android Studio and Android SDK

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd mobileapp
npm install
```

### 2. Configure Environment

Create a `.env` file in the `mobileapp` directory:

```env
API_URL=http://your-backend-url.com/api
SOCKET_URL=http://your-backend-url.com
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APP_NAME=Netcify
```

**For local development:**
- Use your computer's local IP address (e.g., `http://192.168.1.100:3000`)
- Don't use `localhost` or `127.0.0.1` as mobile devices can't reach it

### 3. Start Development Server

```bash
npm start
```

This will open Expo Dev Tools in your browser.

### 4. Run on Device/Simulator

#### iOS (macOS only):
```bash
npm run ios
```

#### Android:
```bash
npm run android
```

#### Expo Go App:
1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Scan the QR code from the terminal or Expo Dev Tools
3. The app will load on your device

## 📁 Project Structure

```
mobileapp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and Socket services
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── theme/              # Theme and styling
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   └── constants/          # App constants
├── assets/                 # Images, fonts, sounds
├── app.json               # Expo configuration
├── App.tsx                # Root component
└── package.json           # Dependencies
```

## 🔧 Development

### Available Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (macOS only)
- `npm run web` - Run in web browser (limited functionality)

### Debugging

- Press `m` in terminal to open developer menu
- Enable Remote JS Debugging
- Use React Native Debugger for advanced debugging
- Check console logs in terminal

## 📱 Testing on Physical Devices

### iOS:
1. Install Expo Go from App Store
2. Ensure device is on same WiFi network
3. Scan QR code with Camera app
4. App opens in Expo Go

### Android:
1. Install Expo Go from Play Store
2. Ensure device is on same WiFi network
3. Scan QR code with Expo Go app
4. App loads automatically

## 🏗️ Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS:
```bash
eas build:configure
```

4. Build for iOS:
```bash
eas build --platform ios
```

5. Build for Android:
```bash
eas build --platform android
```

### Local Builds

#### iOS (macOS only):
```bash
expo prebuild
cd ios && pod install && cd ..
npx react-native run-ios --configuration Release
```

#### Android:
```bash
expo prebuild
cd android && ./gradlew assembleRelease
```

## 📦 App Store Submission

### iOS App Store

1. **Prepare Assets:**
   - App icon (1024x1024)
   - Screenshots (various sizes)
   - App description and keywords

2. **Build with EAS:**
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store:**
```bash
eas submit --platform ios
```

4. **Requirements:**
   - Apple Developer account ($99/year)
   - App Store Connect access
   - Privacy policy URL
   - Terms of service URL

### Google Play Store

1. **Prepare Assets:**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (various sizes)
   - App description

2. **Build with EAS:**
```bash
eas build --platform android --profile production
```

3. **Submit to Play Store:**
```bash
eas submit --platform android
```

4. **Requirements:**
   - Google Play Developer account ($25 one-time)
   - Privacy policy URL
   - Content rating questionnaire

## 🔐 Permissions

The app requests the following permissions:

### iOS:
- **Camera** - Profile pictures and video calls
- **Photo Library** - Profile picture selection
- **Microphone** - Voice and video calls
- **Notifications** - Message alerts
- **Location** (optional) - Location sharing

### Android:
- **CAMERA** - Profile pictures and video calls
- **READ_EXTERNAL_STORAGE** - Profile picture selection
- **WRITE_EXTERNAL_STORAGE** - Save photos
- **RECORD_AUDIO** - Voice and video calls
- **NOTIFICATIONS** - Message alerts
- **ACCESS_FINE_LOCATION** (optional) - Location sharing

## 🐛 Troubleshooting

### Common Issues

**1. "Unable to connect to server"**
- Check if backend server is running
- Verify API_URL and SOCKET_URL in .env
- Use local IP address, not localhost
- Check firewall settings

**2. "Network request failed"**
- Enable network permissions in app.json
- Check internet connection
- Verify CORS settings on backend

**3. "Module not found"**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Clear Metro bundler cache

**4. "Build failed"**
- Check Expo SDK compatibility
- Update dependencies: `npx expo install --fix`
- Review error logs in terminal

### Reset Project

```bash
# Clear all caches
expo start -c

# Reset iOS simulator
xcrun simctl erase all

# Reset Android emulator
adb -e emu kill
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

## 🤝 Backend Integration

This mobile app connects to the same backend server as the web application:
- Uses same API endpoints
- Same Socket.IO events
- Same authentication system
- Same database (MongoDB)
- Users can use both web and mobile with same account

**Backend Repository:** Check the main `server/` directory in the root project.

## 🎨 Customization

### Change App Colors

Edit `src/theme/colors.ts` to customize the color scheme.

### Change App Name

1. Update `name` in `app.json`
2. Update `APP_NAME` in `.env`
3. Rebuild the app

### Add New Screens

1. Create screen component in `src/screens/`
2. Add route in `src/navigation/`
3. Update navigation types if using TypeScript

## 📝 Notes

- **Camera permissions** must be requested at runtime
- **Push notifications** require additional setup with FCM/APNs
- **WebRTC calls** are planned for future updates
- **Offline support** is not yet implemented

## 🚧 Roadmap

- [ ] WebRTC voice/video calls
- [ ] Push notifications
- [ ] Offline message queue
- [ ] Voice messages
- [ ] File sharing
- [ ] End-to-end encryption
- [ ] Biometric authentication
- [ ] App shortcuts
- [ ] Widget support

## 📄 License

This project is part of the Netcify platform. See LICENSE file in the root directory.

## 👥 Support

For issues and questions:
- Check existing documentation
- Review troubleshooting section
- Contact development team

---

**Built with ❤️ using Expo and React Native**
