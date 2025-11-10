# Admin Dashboard Security Features

## Overview
This document outlines all security measures implemented in the admin dashboard to protect against common web vulnerabilities and ensure secure operation.

## 🛡️ Security Features Implemented

### 1. Authentication & Authorization
- **reCAPTCHA v3**: Invisible bot protection on login
- **Role-Based Access**: Only users with 'admin' role can access dashboard
- **JWT Token Validation**: Tokens are validated for expiration
- **Secure Session Management**: 30-minute inactivity timeout
- **Password Recovery**: Secure token-based password reset with 1-hour expiration

### 2. Rate Limiting
- **Login Rate Limiting**: Maximum 5 login attempts per 15 minutes
- **API Rate Limiting**: Maximum 30 API requests per minute
- Client-side rate limiting prevents excessive requests

### 3. Input Sanitization
- **XSS Protection**: All user inputs are sanitized before processing
- **HTML Sanitization**: Prevents injection of malicious scripts
- **Input Validation**: Username, email, and password validation rules

### 4. Session Security
- **Auto-logout**: Automatic logout after 30 minutes of inactivity
- **Activity Tracking**: Mouse, keyboard, scroll, and touch events tracked
- **Session Cleanup**: Proper cleanup on logout or expiration
- **Token Expiration**: JWT tokens validated on every auth check

### 5. Security Headers (Netlify)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 6. Content Security Policy (CSP)
- Restricts resource loading to trusted sources
- Prevents inline script execution (with exceptions for necessary scripts)
- Blocks object and embed tags
- Enforces HTTPS with upgrade-insecure-requests
- Prevents clickjacking with frame-ancestors 'none'

### 7. Secure Storage
- **Encrypted Local Storage**: Sensitive data obfuscated before storage
- **Token Encryption**: Admin tokens are encoded
- **Automatic Cleanup**: Tokens removed on logout or expiration

### 8. Audit Logging
- **Action Tracking**: All security-relevant actions logged
- **Failed Attempts**: Login failures and rate limit hits logged
- **Session Events**: Login, logout, and session expiration tracked
- **Log Export**: Ability to export audit logs for review

### 9. CORS Protection
- Backend configured with specific allowed origins
- Only trusted domains can make API requests
- Credentials properly handled in requests

### 10. Clickjacking Prevention
- Automatic detection and prevention of iframe embedding
- Frame-ancestors directive in CSP
- X-Frame-Options header set to DENY

## 📊 Audit Log Events

The system logs the following security events:

| Event | Description |
|-------|-------------|
| `LOGIN_ATTEMPT` | User attempts to login |
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILED` | Failed login attempt |
| `LOGIN_FAILED_INVALID_ROLE` | Login with non-admin role |
| `LOGIN_RATE_LIMITED` | Too many login attempts |
| `LOGIN_ERROR` | Login system error |
| `LOGOUT` | User logout |
| `SESSION_EXPIRED` | Automatic session timeout |
| `TOKEN_EXPIRED` | JWT token expired |
| `AUTH_CHECK_SUCCESS` | Successful authentication check |
| `AUTH_CHECK_FAILED_INVALID_ROLE` | Auth check with invalid role |
| `AUTH_CHECK_ERROR` | Authentication system error |

## 🔐 Security Utilities

### Rate Limiter
```typescript
import { loginRateLimiter, apiRateLimiter } from './utils/security';

// Check if request is allowed
if (!loginRateLimiter.canMakeRequest('login')) {
  // Handle rate limit exceeded
}

// Reset on successful action
loginRateLimiter.reset('login');
```

### Input Sanitization
```typescript
import { sanitizeInput, sanitizeHTML } from './utils/security';

const clean = sanitizeInput(userInput);
const cleanHTML = sanitizeHTML(htmlContent);
```

### Session Management
```typescript
import { SecureSessionManager } from './utils/security';

// Initialize with expiration callback
SecureSessionManager.init(() => {
  // Handle session expired
});

// Update activity
SecureSessionManager.updateActivity();

// Get remaining time
const remaining = SecureSessionManager.getRemainingTime();
```

### Audit Logging
```typescript
import { AuditLogger } from './utils/security';

// Log an action
AuditLogger.log('ACTION_NAME', { details }, userId);

// Get all logs
const logs = AuditLogger.getLogs();

// Export logs
const json = AuditLogger.exportLogs();
```

### Token Validation
```typescript
import { isTokenExpired, getTokenExpiration } from './utils/security';

if (isTokenExpired(token)) {
  // Handle expired token
}

const expiration = getTokenExpiration(token);
```

### Secure Storage
```typescript
import { SecureStorage } from './utils/security';

// Store encrypted data
SecureStorage.setItem('key', 'value');

// Retrieve and decrypt
const value = SecureStorage.getItem('key');

// Remove item
SecureStorage.removeItem('key');
```

### Input Validators
```typescript
import { validators } from './utils/security';

const isValidEmail = validators.email('user@example.com');
const isValidUsername = validators.username('admin123');
const isValidPassword = validators.password('SecurePass123');
```

## 🚀 Deployment Checklist

### Before Production Deployment:

- [ ] Ensure `VITE_RECAPTCHA_SITE_KEY` is set in Netlify environment variables
- [ ] Verify `VITE_API_URL` points to production backend
- [ ] Confirm reCAPTCHA domain includes production URL
- [ ] Test all security headers are properly set
- [ ] Verify CSP doesn't block necessary resources
- [ ] Test session timeout functionality
- [ ] Verify rate limiting works correctly
- [ ] Check audit logs are being created
- [ ] Test password recovery email delivery
- [ ] Ensure HTTPS is enforced
- [ ] Review and test CORS configuration
- [ ] Verify token expiration handling

## 🔍 Security Monitoring

### Regular Tasks:

1. **Review Audit Logs**: Check for suspicious activity patterns
2. **Monitor Failed Logins**: Track unusual login attempts
3. **Session Analysis**: Review session duration and timeout effectiveness
4. **Rate Limit Hits**: Check if legitimate users are being blocked
5. **Token Expiration**: Ensure tokens are expiring correctly

### Red Flags:

- Multiple failed login attempts from same IP
- Rapid succession of login attempts
- Login attempts outside business hours
- Unusual geographic locations
- Rate limiter frequently triggered
- Session hijacking attempts

## 📝 Best Practices

1. **Keep Dependencies Updated**: Regularly update npm packages
2. **Monitor Security Advisories**: Watch for vulnerabilities in dependencies
3. **Regular Security Audits**: Perform periodic security reviews
4. **Password Policy**: Enforce strong password requirements
5. **Token Rotation**: Consider implementing token refresh mechanism
6. **Multi-Factor Authentication**: Consider adding 2FA in future
7. **IP Whitelisting**: Consider restricting admin access to specific IPs
8. **Security Training**: Ensure admins understand security best practices

## 🆘 Incident Response

If a security breach is suspected:

1. **Immediate Actions**:
   - Review audit logs immediately
   - Force logout all active sessions
   - Change admin credentials
   - Temporarily disable admin access if needed

2. **Investigation**:
   - Export and review all audit logs
   - Check for unauthorized access patterns
   - Review API logs on backend
   - Identify affected data/users

3. **Remediation**:
   - Patch identified vulnerabilities
   - Reset compromised credentials
   - Notify affected parties if needed
   - Document incident and response

4. **Prevention**:
   - Implement additional security measures
   - Update security policies
   - Increase monitoring

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Guide](https://content-security-policy.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🔄 Version History

- **v1.0.0** (2025-01-11): Initial security implementation
  - reCAPTCHA v3 integration
  - Rate limiting
  - Session management
  - Audit logging
  - Security headers
  - Password recovery
