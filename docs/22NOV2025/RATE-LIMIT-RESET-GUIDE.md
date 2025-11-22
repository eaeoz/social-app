# Emergency Rate Limit Reset Guide

## Overview
This guide explains how to reset rate limiting and account lockout data when users are unable to login due to "Too many requests" errors.

## When to Use This
- Users are locked out after too many failed login attempts
- Emergency situation requiring immediate access restoration
- Testing/development purposes
- After resolving security issues

## Quick Start

### View Help
```bash
node server/utils/resetUserRateLimit.js --help
```

### Reset All Users (Emergency)
```bash
node server/utils/resetUserRateLimit.js --all
```

### Reset Specific User by Username
```bash
node server/utils/resetUserRateLimit.js --username johndoe
```

### Reset Specific User by Email
```bash
node server/utils/resetUserRateLimit.js --email user@example.com
```

## What Gets Reset

When you run this utility, the following data is cleared:

1. **Login Attempts Counter** - Resets failed login attempt count to 0
2. **Account Lockout Timestamp** - Removes temporary account lock
3. **Rate Limiting Data** - Clears all rate limit tracking

## Usage Examples

### Example 1: Reset Single User
```bash
# User "alice" forgot password and got locked out after 5 attempts
node server/utils/resetUserRateLimit.js --username alice

# Output:
# ✅ Rate Limit Reset Complete!
# 📊 Target: user: alice
# 🔄 Users updated: 1
# 
# The following data has been cleared:
#   • Login attempts counter
#   • Account lockout timestamp
#   • Rate limiting data
# 
# Users can now attempt to login again.
```

### Example 2: Reset by Email
```bash
# User contacted support with email
node server/utils/resetUserRateLimit.js --email alice@example.com
```

### Example 3: Mass Reset (After System Issue)
```bash
# System had issues causing false lockouts
node server/utils/resetUserRateLimit.js --all

# Output:
# ✅ Rate Limit Reset Complete!
# 📊 Target: all users
# 🔄 Users updated: 150
```

## Important Notes

⚠️ **Security Considerations:**
- Only run this script when necessary
- Document why you're resetting (for audit trail)
- Consider investigating why users got locked out
- In production, limit access to this script

⚠️ **Requirements:**
- Must have `.env` file configured with MongoDB connection
- Requires direct server access
- Cannot be run from client/browser

⚠️ **Backup Recommendation:**
Before running `--all`, consider backing up your database:
```bash
mongodump --uri="your_mongodb_uri" --out=backup_before_reset
```

## Understanding Rate Limits

### Current System Limits
- **Max Login Attempts:** 5 attempts
- **Lockout Duration:** 15 minutes
- **Rate Limit Window:** 15 minutes
- **Max Requests per Window:** 100 requests

### How It Works
1. User attempts login with wrong password
2. System increments `loginAttempts` counter
3. After 5 attempts, `lockUntil` timestamp is set (15 minutes from now)
4. User cannot login until `lockUntil` expires
5. This script clears both fields, allowing immediate retry

## Troubleshooting

### "Cannot find module" Error
```bash
# Make sure you're in the project root directory
cd /path/to/social-app
node server/utils/resetUserRateLimit.js --help
```

### "Connection failed" Error
```bash
# Check your .env file has correct MongoDB URI
# Verify MongoDB is accessible
# Check network/firewall settings
```

### No Users Updated
```bash
# Verify the username/email exists
# Check for typos in the command
# Ensure MongoDB connection is working
```

## Alternative: Manual Database Reset

If the script doesn't work, you can manually reset via MongoDB:

### MongoDB Shell
```javascript
// Connect to your database
use your_database_name

// Reset all users
db.users.updateMany(
  {},
  {
    $unset: {
      loginAttempts: "",
      lockUntil: "",
      rateLimitData: ""
    }
  }
)

// Reset specific user
db.users.updateOne(
  { username: "johndoe" },
  {
    $unset: {
      loginAttempts: "",
      lockUntil: "",
      rateLimitData: ""
    }
  }
)
```

### MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `users` collection
4. Find the user document
5. Edit the document and remove these fields:
   - `loginAttempts`
   - `lockUntil`
   - `rateLimitData`
6. Save changes

## Best Practices

### 1. Document Usage
Create a log entry when using this script:
```bash
echo "$(date): Reset rate limit for user alice - Reason: Legitimate lockout after password change" >> rate_limit_resets.log
```

### 2. Investigate Root Cause
Before resetting, understand why:
- Was it a brute force attempt? (Keep lockout)
- User legitimately forgot password? (Reset OK)
- System glitch? (Reset all)

### 3. Consider Alternatives
- Password reset flow (better for forgot password)
- Adjust rate limit settings if too strict
- Implement CAPTCHA for multiple failures

### 4. Monitor After Reset
- Check if user successfully logs in
- Monitor for repeated lockouts
- Review security logs

## Security Audit Trail

Keep track of when and why you reset rate limits:

```bash
# Create audit log
cat >> rate_limit_audit.log << EOF
Date: $(date)
Action: Rate limit reset
Target: alice@example.com
Reason: User legitimately locked out, verified via support ticket #12345
Operator: admin@company.com
EOF
```

## Support Contact

If you need help:
1. Check this guide first
2. Review error messages
3. Check MongoDB connection
4. Verify .env configuration
5. Contact system administrator

## Related Documentation

- `SECURITY-FEATURES.md` - Overview of security features
- `server/middleware/auth.js` - Rate limiting implementation
- `server/controllers/authController.js` - Login attempt tracking

---

**Last Updated:** November 9, 2025
**Version:** 1.0
