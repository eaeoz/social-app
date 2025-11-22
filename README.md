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

A React Native mobile app is available in the `mobileapp/` directory.

```bash
cd mobileapp
npm install
npx expo start
```

See [Mobile App Guide](docs/mobileapp/MOBILE-APP-GUIDE.md) for detailed setup instructions.

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
