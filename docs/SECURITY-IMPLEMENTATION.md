# Security Implementation Guide

## Overview
This document describes the comprehensive security measures implemented in the social-app authentication system to protect against various attacks including brute force, bots, and common web vulnerabilities.

---

## 🛡️ Security Layers

### 1. Helmet Security Headers
**Purpose:** Protect against common web vulnerabilities

**Implementation:** `server/server.js`
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: { ... },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

**Protection Against:**
- ✅ XSS (Cross-Site Scripting) attacks
- ✅ Clickjacking attacks
- ✅ MIME type sniffing
- ✅ DNS prefetch control
- ✅ Frameguard protection
- ✅ IE No Open protection
- ✅ Content Security Policy violations

---

### 2. Rate Limiting (express-rate-limit)
**Purpose:** Prevent request flooding and automated attacks

#### General API Rate Limit
```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
});
```
- Applied to all `/api/` routes
- Prevents API abuse

#### Login Rate Limit
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 login attempts
  skipSuccessfulRequests: true
});
```
- 5 login attempts per 15 minutes per IP
- Successful logins don't count
- Applied to `/api/auth/login`

#### Registration Rate Limit
```javascript
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // 3 registrations
});
```
- 3 account creations per hour per IP
- Prevents mass bot registration
- Applied to `/api/auth/register`

#### Email Action Rate Limit
```javascript
const emailActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // 3 requests
});
```
- 3 email-related actions per hour per IP
- Prevents email spam/flooding
- Applied to verification and resend endpoints

---

### 3. IP-Based Blocking
**Purpose:** Block malicious IPs temporarily

**Implementation:** `server/server.js`

#### Features:
- Tracks failed login attempts per IP address
- Blocks IP after **10 failed attempts** within 1 hour
- Block duration: **30 minutes**
- Automatic cleanup of expired blocks
- Works independently from account lockout

#### Functions:
```javascript
// Track failed attempt
export function trackFailedAttempt(ip) {
  // Increments counter, blocks at 10 attempts
}

// Clear on success
export function clearFailedAttempts(ip) {
  // Resets counter
}

// Middleware to check blocks
const checkIPBlock = (req, res, next) => {
  // Checks if IP is blocked before allowing request
}
```

#### Response when blocked:
```json
{
  "error": "Too many failed attempts. Your IP has been temporarily blocked.",
  "blockedFor": "25 minutes",
  "message": "Please try again later or contact support if you believe this is an error."
}
```

---

### 4. Account Lockout Mechanism
**Purpose:** Protect individual accounts from brute force attacks

**Implementation:** `server/controllers/authController.js`

#### Features:
- Tracks failed login attempts per user account (stored in MongoDB)
- Locks account after **5 failed attempts**
- Lock duration: **30 minutes**
- Shows remaining attempts before lockout
- Automatic unlock after expiration
- Resets counter on successful login

#### Database Fields:
```javascript
{
  failedLoginAttempts: Number,     // Counter of failed attempts
  lastFailedLogin: Date,            // Timestamp of last failure
  accountLocked: Boolean,           // Lock status
  accountLockedUntil: Date          // Unlock timestamp
}
```

#### Login Flow:
```
1. Check if account is locked
   ├─ If locked: Return 423 error with remaining time
   └─ If expired lock: Clear and proceed

2. Validate password
   ├─ If invalid: 
   │   ├─ Increment failedLoginAttempts
   │   ├─ Track IP failed attempt
   │   ├─ If attempts >= 5: Lock account for 30 minutes
   │   └─ Return error with attempts remaining
   └─ If valid:
       ├─ Clear IP failed attempts
       ├─ Reset account lockout fields
       └─ Generate tokens and login
```

#### Response Examples:

**Failed attempt (1-4):**
```json
{
  "error": "Invalid credentials",
  "attemptsRemaining": 3,
  "message": "Invalid credentials. 3 attempts remaining before account lockout."
}
```

**Account locked (5th attempt):**
```json
{
  "error": "Account locked due to multiple failed login attempts.",
  "lockedFor": "30 minutes",
  "attemptsRemaining": 0,
  "message": "Your account has been temporarily locked. Please try again in 30 minutes or reset your password."
}
```

**Already locked:**
```json
{
  "error": "Account temporarily locked due to multiple failed login attempts.",
  "lockedFor": "15 minutes",
  "message": "Please try again in 15 minutes or reset your password."
}
```

---

### 5. reCAPTCHA Protection
**Purpose:** Prevent bot attacks

**Implementation:** `server/controllers/authController.js`

```javascript
async function verifyRecaptcha(token, action, minScore = 0.5) {
  // Verifies token with Google reCAPTCHA API
  // Checks score and action
}
```

- Applied to login and registration
- Minimum score: 0.5
- Action verification (login/register)
- Graceful fallback if service unavailable

---

### 6. Password Security
**Purpose:** Secure password storage

**Implementation:** bcrypt hashing

```javascript
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

- Passwords hashed with bcrypt
- 10 salt rounds (configurable)
- Plain passwords never stored
- Minimum 6 characters required

---

### 7. JWT Authentication
**Purpose:** Secure session management

**Implementation:** `server/utils/jwt.js`

- Access tokens for authentication
- Refresh tokens for token renewal
- Tokens verified on protected routes
- Invalid/expired tokens rejected

---

### 8. Email Verification
**Purpose:** Prevent fake account creation

**Implementation:** `server/controllers/authController.js`

- Required before first login
- 24-hour token expiration
- Secure random token generation
- Resend functionality (rate limited)

---

## 🔒 Complete Security Stack

```
┌─────────────────────────────────────────┐
│  Layer 1: Helmet Headers                │
│  (XSS, Clickjacking, MIME Sniffing)     │
├─────────────────────────────────────────┤
│  Layer 2: Rate Limiting                 │
│  (IP-based request limits)              │
├─────────────────────────────────────────┤
│  Layer 3: IP Blocking                   │
│  (10 fails = 30 min block)              │
├─────────────────────────────────────────┤
│  Layer 4: Account Lockout               │
│  (5 fails = 30 min lock)                │
├─────────────────────────────────────────┤
│  Layer 5: reCAPTCHA                     │
│  (Bot detection & prevention)           │
├─────────────────────────────────────────┤
│  Layer 6: Password Hashing              │
│  (bcrypt with salt rounds)              │
├─────────────────────────────────────────┤
│  Layer 7: JWT Authentication            │
│  (Secure token-based sessions)          │
├─────────────────────────────────────────┤
│  Layer 8: Email Verification            │
│  (Prevent fake accounts)                │
└─────────────────────────────────────────┘
```

---

## 📊 Attack Scenarios & Protection

### Scenario 1: Brute Force Password Attack
**Attack:** Automated script tries thousands of passwords

**Protection:**
1. ✅ Rate Limiter stops after 5 attempts in 15 minutes
2. ✅ Account locks after 5 failed attempts
3. ✅ IP blocks after 10 failed attempts
4. ✅ reCAPTCHA detects automated behavior

**Result:** Attack stopped at multiple layers

---

### Scenario 2: Distributed Brute Force
**Attack:** Attacker uses multiple IPs

**Protection:**
1. ✅ Account lockout (per-account, not per-IP)
2. ✅ Each IP still rate limited independently
3. ✅ reCAPTCHA required for each attempt

**Result:** Account locked after 5 attempts regardless of IP distribution

---

### Scenario 3: Bot Registration Spam
**Attack:** Bot creates thousands of accounts

**Protection:**
1. ✅ Registration rate limit: 3 accounts per hour per IP
2. ✅ reCAPTCHA on registration
3. ✅ Email verification required

**Result:** Maximum 3 unverified accounts per hour per IP

---

### Scenario 4: XSS Attack
**Attack:** Malicious script injection

**Protection:**
1. ✅ Helmet CSP headers block inline scripts
2. ✅ Input validation on all endpoints
3. ✅ Output encoding

**Result:** XSS attacks prevented

---

### Scenario 5: Clickjacking
**Attack:** Embedding site in iframe to steal clicks

**Protection:**
1. ✅ Helmet X-Frame-Options: DENY
2. ✅ Frame ancestors restriction

**Result:** Site cannot be embedded in iframes

---

## 📝 Security Logs

The system logs all security events:

```javascript
// Account lockout
🔒 Account locked: username (5 failed attempts)
🔓 Account lock expired and cleared: username

// IP blocking
🚫 IP blocked for 30 minutes: 192.168.1.1 (10 failed attempts)
🔓 IP unblocked: 192.168.1.1
⚠️ Failed attempt from 192.168.1.1: 5/10

// Rate limiting
🚨 Login rate limit exceeded for IP: 192.168.1.1
🚨 Registration rate limit exceeded for IP: 192.168.1.1
⚠️ Rate limit exceeded for IP: 192.168.1.1
```

---

## 🔧 Configuration

### Environment Variables
```env
# Password Security
BCRYPT_SALT_ROUNDS=10

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_secret_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Customizable Values
```javascript
// Rate limits (server/server.js)
- General API: 100 requests per 15 minutes
- Login: 5 attempts per 15 minutes
- Registration: 3 accounts per hour
- Email actions: 3 requests per hour

// IP blocking (server/server.js)
- Threshold: 10 failed attempts
- Duration: 30 minutes

// Account lockout (server/controllers/authController.js)
- Threshold: 5 failed attempts
- Duration: 30 minutes
```

---

## ✅ Testing Security

### Test Account Lockout
1. Attempt login with wrong password 5 times
2. 6th attempt should show account locked
3. Wait 30 minutes or check database to clear

### Test IP Blocking
1. Make 10 failed login attempts from same IP
2. 11th attempt should show IP blocked
3. Wait 30 minutes for automatic unblock

### Test Rate Limiting
1. Make 6 login requests within 15 minutes
2. 6th request should be rate limited

### Database Check
```javascript
// Check lockout status
db.users.findOne({ username: "testuser" }, {
  failedLoginAttempts: 1,
  accountLocked: 1,
  accountLockedUntil: 1
})

// Manual unlock (if needed)
db.users.updateOne(
  { username: "testuser" },
  { 
    $set: { 
      accountLocked: false,
      accountLockedUntil: null,
      failedLoginAttempts: 0
    }
  }
)
```

---

## 🚀 Deployment Notes

### Production Checklist
- [ ] Set strong JWT secrets in environment variables
- [ ] Configure reCAPTCHA with production keys
- [ ] Set appropriate BCRYPT_SALT_ROUNDS (10-12)
- [ ] Enable HTTPS for secure communication
- [ ] Monitor security logs regularly
- [ ] Set up alerts for suspicious activity
- [ ] Regularly update dependencies
- [ ] Test all security features before deployment

### Monitoring
Monitor these metrics:
- Failed login attempts per hour
- Locked accounts per day
- Blocked IPs per day
- Rate limit violations
- reCAPTCHA failures

---

## 📚 Dependencies

```json
{
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2"
}
```

---

## 🔐 Security Best Practices

1. **Keep Dependencies Updated**
   - Regularly run `npm audit`
   - Update security patches promptly

2. **Monitor Logs**
   - Review security logs daily
   - Set up alerts for unusual patterns

3. **Regular Security Audits**
   - Test security features regularly
   - Perform penetration testing

4. **User Education**
   - Encourage strong passwords
   - Provide password reset functionality
   - Inform users about security features

5. **Incident Response**
   - Have a plan for security breaches
   - Monitor for account takeover attempts
   - Provide user support for locked accounts

---

## 📞 Support

For security concerns or to report vulnerabilities:
- Review logs in server console
- Check MongoDB for lockout status
- Contact support with security issues

---

## 📄 License

This security implementation is part of the social-app project.

---

**Last Updated:** November 9, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
