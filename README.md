# Social App - Full-Stack Social Media Platform

A modern, feature-rich social media platform with real-time messaging, video calls, blog system, and admin dashboard.

[![Security Audit](https://img.shields.io/badge/Security-Audited-success)](docs/SECURITY-AUDIT-REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Features

### Core Social Features
- 👤 **User Authentication** - JWT-based auth with refresh tokens
- 💬 **Real-time Messaging** - WebSocket-powered instant messaging
- 📹 **Video Calls** - Peer-to-peer video calling with WebRTC
- 👥 **User Profiles** - Customizable profiles with photo uploads
- 🔔 **Notifications** - Real-time push notifications
- 🔍 **User Search** - Find and connect with other users

### Content & Moderation
- 📝 **Blog System** - Full-featured blogging platform
- 🛡️ **NSFW Detection** - Automated content moderation
- 🚨 **Report System** - User reporting and admin review
- 🤬 **Profanity Filter** - Automatic content filtering

### Admin Features
- 📊 **Admin Dashboard** - Comprehensive management interface
- 👮 **User Management** - Ban, suspend, and manage users
- 📈 **Analytics** - User statistics and activity tracking
- ⚙️ **Site Settings** - Configure platform-wide settings

### Technical Features
- 🔒 **Security Headers** - CSP, HSTS, and more
- ✉️ **Email Verification** - SMTP-based email verification
- 🔐 **Google OAuth** - Social login integration
- 📱 **Mobile App** - React Native mobile application
- 🌐 **SEO Optimized** - Meta tags, sitemaps, and structured data
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 💾 **Supabase Backup** - Automated database backup solution

---

## 🏗️ Architecture

```
social-app/
├── client/              # Frontend (React + TypeScript + Vite)
├── server/              # Backend (Node.js + Express)
├── admin-client/        # Admin Dashboard (React + TypeScript)
├── blog/                # Blog Platform (React + TypeScript)
├── mobileapp/           # Mobile App (React Native + Expo)
├── netlify/             # Serverless functions
├── docs/                # Documentation
└── test/                # Desktop app (Electron)
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Socket.io for real-time features
- WebRTC for video calls

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io for WebSockets
- Appwrite for file storage
- JWT for authentication

**Infrastructure:**
- Netlify (Frontend hosting)
- Railway/Render (Backend hosting)
- MongoDB Atlas (Database)
- Cloudflare (CDN & DDoS protection)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Appwrite account (for file storage)
- SMTP credentials (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/social-app.git
cd social-app
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Install admin client dependencies
cd ../admin-client && npm install

# Install blog dependencies
cd ../blog && npm install
```

3. **Configure environment variables**

See [Environment Variables Guide](docs/DEPLOYMENT-ENV-VARIABLES.md) for detailed setup.

**Backend (.env in server/):**
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
PORT=5000
```

**Frontend (.env in client/):**
```env
VITE_API_URL=http://localhost:5000
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_RECAPTCHA_SITE_KEY=your_site_key
```

4. **Set up MongoDB collections**
```bash
cd server
node setup-mongodb.js
```

5. **Start development servers**

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev

# Terminal 3 - Start admin dashboard (optional)
cd admin-client
npm run dev

# Terminal 4 - Start blog (optional)
cd blog
npm run dev
```

6. **Access the applications**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:5174
- Blog: http://localhost:5175

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](docs/) folder:

### Getting Started
- [Quick Start Guide](docs/QUICK-START.md)
- [Simple Setup Guide](docs/SIMPLE-SETUP-GUIDE.md)
- [Easiest Method](docs/EASIEST-METHOD.md)

### Deployment
- [Deployment Checklist](docs/DEPLOYMENT-CHECKLIST.md)
- [Netlify Frontend Guide](docs/NETLIFY-FRONTEND-GUIDE.md)
- [Railway Deployment](docs/RAILWAY-DEPLOYMENT.md)
- [Render Backend Only](docs/RENDER-BACKEND-ONLY.md)

### Features & Configuration
- [Email Verification Guide](docs/EMAIL-VERIFICATION-GUIDE.md)
- [Google OAuth Setup](docs/GOOGLE-OAUTH-SETUP.md)
- [Blog Setup Guide](docs/BLOG-SETUP-GUIDE.md)
- [NSFW Content Detection](docs/NSFW-CONTENT-DETECTION-GUIDE.md)
- [Sound Settings Guide](docs/SOUND-SETTINGS-GUIDE.md)

### Security
- [Security Audit Report](docs/SECURITY-AUDIT-REPORT.md) ⭐
- [Security Implementation](docs/SECURITY-IMPLEMENTATION.md)
- [Security Headers Guide](docs/SECURITY-HEADERS-FIX-GUIDE.md)
- [User Deletion Security](docs/USER-DELETION-SECURITY-FIX.md)

### Admin & Management
- [Admin Dashboard Guide](docs/ADMIN-DASHBOARD-GUIDE.md)
- [Site Settings Guide](docs/SITESETTINGS-GUIDE.md)
- [Session Management](docs/SESSION-MANAGEMENT.md)

### Database
- [MongoDB Setup](docs/MONGODB-SETUP.md)
- [MongoDB Atlas IP Whitelist](docs/MONGODB-ATLAS-IP-WHITELIST.md)
- [Supabase Backup Setup](docs/SUPABASE-BACKUP-SETUP.md)

### Architecture & Technical
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Backend SMTP Setup](docs/BACKEND-SMTP-SETUP.md)
- [Call Feature Implementation](docs/CALL-FEATURE-IMPLEMENTATION.md)
- [SEO Improvements](docs/SEO-IMPROVEMENTS.md)
- [Accessibility Improvements](docs/ACCESSIBILITY-IMPROVEMENTS.md)

### Client (Frontend) Documentation
- [Client README](docs/client/README.md) - Frontend overview
- [SEO Guide](docs/client/SEO-GUIDE.md) - SEO implementation details
- [Netlify Email Setup](docs/client/NETLIFY-EMAIL-SETUP.md) - Email function configuration
- [Profanity Filter Guide](docs/client/PROFANITY-FILTER-GUIDE.md) - Content filtering setup
- [Verification Setup](docs/client/VERIFICATION-SETUP.md) - Email verification configuration

### Admin Dashboard Documentation
- [Admin Client README](docs/admin-client/README.md) - Admin dashboard overview
- [Deployment Guide](docs/admin-client/DEPLOYMENT.md) - Admin deployment instructions
- [Security Features](docs/admin-client/SECURITY-FEATURES.md) - Admin security implementation
- [SEO Implementation](docs/admin-client/SEO-IMPLEMENTATION.md) - Admin SEO setup

### Blog Platform Documentation
- [Blog README](docs/blog/README.md) - Blog platform overview
- [Deployment Guide](docs/blog/DEPLOYMENT-GUIDE.md) - Blog deployment instructions
- [Final Summary](docs/blog/FINAL-SUMMARY.md) - Blog feature summary
- [Backend API Integration](docs/blog/BACKEND-API-INTEGRATION.md) - API integration guide
- [SEO Improvements](docs/blog/SEO-IMPROVEMENTS.md) - Blog SEO enhancements
- [SEO URL Implementation](docs/blog/SEO-URL-IMPLEMENTATION.md) - SEO-friendly URLs
- [Sitemap Guide](docs/blog/SITEMAP-GUIDE.md) - Sitemap generation
- [Google Analytics Setup](docs/blog/GOOGLE-ANALYTICS-SETUP.md) - Analytics integration
- [Google AdSense Setup](docs/blog/GOOGLE-ADSENSE-SETUP.md) - Monetization setup
- [reCAPTCHA Setup](docs/blog/RECAPTCHA-SETUP.md) - Bot protection
- [Appwrite CORS Fix](docs/blog/APPWRITE-CORS-FIX.md) - CORS configuration
- [Appwrite Search Setup](docs/blog/APPWRITE-SEARCH-SETUP.md) - Search functionality

### Mobile App Documentation
- [Mobile App Guide](docs/mobileapp/MOBILE-APP-GUIDE.md) - Complete setup guide
- [Mobile App README](docs/mobileapp/README.md) - Overview and quick start
- [Deployment Success](docs/mobileapp/DEPLOYMENT-SUCCESS.md) - Production deployment
- [Mobile Authentication](docs/mobileapp/MOBILE-AUTH-IMPLEMENTATION.md) - Auth implementation
- [Email Verification](docs/mobileapp/MOBILE-EMAIL-VERIFICATION.md) - Email verification flow
- [Profile Management](docs/mobileapp/PROFILE-MANAGEMENT-IMPLEMENTATION.md) - Profile features
- [Photo Editing Feature](docs/mobileapp/PHOTO-EDITING-FEATURE.md) - Photo upload
- [Calling Implementation Plan](docs/mobileapp/CALLING-IMPLEMENTATION-PLAN.md) - Call architecture
- [Calling Quick Start](docs/mobileapp/CALLING-QUICK-START.md) - WebRTC integration
- [Calling UI Complete](docs/mobileapp/CALLING-UI-COMPLETE.md) - Call interface

[View all documentation →](docs/)

---

## 🔒 Security

This project has undergone a comprehensive security audit. See the [Security Audit Report](docs/SECURITY-AUDIT-REPORT.md) for details.

### Security Highlights
- ✅ No hardcoded credentials in codebase
- ✅ All sensitive data in environment variables
- ✅ Security headers implemented (CSP, HSTS, etc.)
- ✅ Rate limiting on all endpoints
- ✅ JWT token authentication with refresh tokens
- ✅ Input validation and sanitization
- ✅ NSFW content detection
- ✅ XSS and CSRF protection

### Reporting Security Issues
If you discover a security vulnerability, please email security@yourapp.com. Do not create public issues for security vulnerabilities.

---

## 📱 Mobile App

A fully-featured React Native mobile application built with Expo, providing complete feature parity with the web application.

### Quick Start

```bash
cd mobileapp
npm install
npx expo start
```

### Documentation

Comprehensive mobile app documentation is available:

#### Getting Started
- [Mobile App Guide](docs/mobileapp/MOBILE-APP-GUIDE.md) - Complete setup and development guide
- [Mobile App README](docs/mobileapp/README.md) - Overview and quick start
- [Deployment Success](docs/mobileapp/DEPLOYMENT-SUCCESS.md) - Production deployment guide

#### Features
- [Mobile Authentication](docs/mobileapp/MOBILE-AUTH-IMPLEMENTATION.md) - Login/registration implementation
- [Email Verification](docs/mobileapp/MOBILE-EMAIL-VERIFICATION.md) - Email verification flow
- [Profile Management](docs/mobileapp/PROFILE-MANAGEMENT-IMPLEMENTATION.md) - Edit profile and change password
- [Photo Editing Feature](docs/mobileapp/PHOTO-EDITING-FEATURE.md) - Profile picture upload with camera/gallery

#### Advanced Features
- [Calling Implementation Plan](docs/mobileapp/CALLING-IMPLEMENTATION-PLAN.md) - Voice/video calling architecture
- [Calling Quick Start](docs/mobileapp/CALLING-QUICK-START.md) - WebRTC integration guide
- [Calling UI Complete](docs/mobileapp/CALLING-UI-COMPLETE.md) - Call interface implementation

### Features

✅ **Core Features:**
- Authentication (Login/Register)
- Real-time messaging (Socket.IO)
- Public chat rooms
- Private messaging
- User profiles with photos
- Location sharing
- Emoji picker
- Dark/Light theme support

✅ **Ready to Enable:**
- Voice calling (WebRTC)
- Video calling (WebRTC)
- Push notifications

### Technology Stack

- React Native + Expo SDK 51+
- TypeScript
- React Native Paper (Material Design 3)
- Socket.IO Client
- Zustand (State Management)
- Axios (API)
- AsyncStorage (Persistence)

### App Store Submission

The mobile app is production-ready and can be submitted to:
- **iOS App Store** - via EAS Build or Xcode
- **Google Play Store** - via EAS Build or Android Studio

See [Deployment Success Guide](docs/mobileapp/DEPLOYMENT-SUCCESS.md) for detailed instructions.

---

## 🧪 Testing

Test users are available for development. See [TEST_USERS.md](docs/TEST_USERS.md).

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Update documentation when needed
- Test your changes thoroughly
- Ensure no security vulnerabilities

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Appwrite](https://appwrite.io/) - Backend as a Service
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Database hosting
- [Supabase](https://supabase.com/) - Database backup solution
- [Netlify](https://www.netlify.com/) - Frontend hosting
- [Railway](https://railway.app/) - Backend hosting
- [Cloudflare](https://www.cloudflare.com/) - CDN & Security

---

## 📞 Support

- 📧 Email: support@yourapp.com
- 💬 Discord: [Join our server](https://discord.gg/yourserver)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/social-app/issues)
- 📖 Documentation: [Full Documentation](docs/)

---

## 🗺️ Roadmap

- [ ] Push notifications for mobile app
- [ ] Group video calls (3+ participants)
- [ ] Story feature (Instagram-style)
- [ ] Dark mode improvements
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Voice messages in chat
- [ ] Live streaming feature

---

**Made with ❤️ by the Social App Team**

⭐ Star this repo if you find it helpful!
