import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import sharp from 'sharp';
import { InputFile, ID } from 'node-appwrite';
import { storage, BUCKET_ID } from '../config/appwrite.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Helper function to verify reCAPTCHA token
async function verifyRecaptcha(token, action, minScore = 0.5) {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️ reCAPTCHA secret key not configured, skipping verification');
    return { success: true, skipped: true };
  }

  if (!token) {
    console.warn('⚠️ No reCAPTCHA token provided, skipping verification');
    return { success: true, skipped: true };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const result = await response.json();

    console.log('🔒 reCAPTCHA verification result:', {
      success: result.success,
      score: result.score,
      action: result.action,
      hostname: result.hostname,
      errorCodes: result['error-codes']
    });

    if (!result.success) {
      console.error('❌ reCAPTCHA verification failed:', result['error-codes']);
      // Allow through but log the error for debugging
      return { success: true, skipped: true, error: 'reCAPTCHA verification failed but allowing through', details: result };
    }

    if (result.action !== action) {
      console.warn(`⚠️ Action mismatch: expected ${action}, got ${result.action}, but allowing through`);
      return { success: true, skipped: true };
    }

    if (result.score < minScore) {
      console.warn(`⚠️ Score too low: ${result.score}, but allowing through`);
      return { success: true, score: result.score };
    }

    return { success: true, score: result.score };
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error);
    // Don't block authentication if reCAPTCHA service is down
    return { success: true, error: 'reCAPTCHA service error', serviceError: true };
  }
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Export multer middleware
export const uploadMiddleware = upload.single('profilePicture');

// Helper function to sanitize username for filename
function sanitizeUsername(username) {
  // Remove all non-alphanumeric characters and convert to lowercase
  return username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// Helper function to process and upload image
async function processAndUploadImage(buffer, username, userId) {
  try {
    // Process image: auto-rotate based on EXIF, resize to 80x80 and convert to JPG
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(80, 80, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 90,
        mozjpeg: true
      })
      .toBuffer();

    // Create filename using sanitized username and userId
    const sanitizedUsername = sanitizeUsername(username);
    const filename = `${sanitizedUsername}_${userId}.jpg`;

    // Upload to Appwrite - let Appwrite generate the ID
    const file = InputFile.fromBuffer(processedBuffer, filename);
    
    const result = await storage.createFile(
      BUCKET_ID,
      ID.unique(), // Let Appwrite generate unique ID
      file
    );

    console.log(`✅ Profile picture uploaded: ${result.$id} (filename: ${filename})`);
    return result.$id;
  } catch (error) {
    console.error('❌ Error processing/uploading image:', error);
    console.error('Error details:', error.message, error.code);
    throw error;
  }
}

// Register new user
export async function register(req, res) {
  try {
    const { username, email, password, fullName, age, gender, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
    if (!recaptchaResult.success && !recaptchaResult.skipped && !recaptchaResult.serviceError) {
      return res.status(400).json({ error: 'Security verification failed. Please try again.' });
    }

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!age || age < 18 || age > 100) {
      return res.status(400).json({ error: 'Age must be between 18 and 100' });
    }

    if (!gender || !['Male', 'Female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be Male or Female' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate email verification token (valid for 24 hours)
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user first (matching MongoDB schema)
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      displayName: fullName || username,
      nickName: username, // Initialize nickName with username
      lastNickNameChange: null, // User can change nickName immediately
      age: parseInt(age),
      gender,
      bio: '',
      status: 'offline',
      role: 'user', // Default role for new users
      profilePictureId: null,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

    // Process and upload profile picture if provided (now we have userId)
    let profilePictureId = null;
    if (req.file) {
      try {
        profilePictureId = await processAndUploadImage(req.file.buffer, username, userId);
        // Update user with profilePictureId
        await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { profilePictureId: profilePictureId } }
        );
      } catch (uploadError) {
        console.error('Failed to upload profile picture:', uploadError);
        // Continue with registration even if image upload fails
      }
    }

    // Create user presence record (matching schema)
    await db.collection('userpresence').insertOne({
      userId: new ObjectId(userId),
      isOnline: false,
      lastSeen: new Date()
    });

    // Create default settings (matching schema)
    await db.collection('settings').insertOne({
      userId: new ObjectId(userId),
      theme: 'light',
      notifications: true,
      notificationSettings: {
        messageSound: true,
        privateChatNotifications: true,
        publicRoomNotifications: true,
        emailNotifications: false
      },
      language: 'en',
      privacy: {
        showOnlineStatus: true,
        showLastSeen: true,
        allowPrivateMessages: true
      },
      updatedAt: new Date()
    });

    // Generate tokens
    const accessToken = generateAccessToken(userId, username);
    const refreshToken = generateRefreshToken(userId);

    // Get profile picture URL if available
    let profilePictureUrl = null;
    if (profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
    }

    // Send verification email (non-blocking)
    try {
      // Try direct email sending first
      await sendVerificationEmail(email, username, emailVerificationToken);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email via direct method:', emailError);
      
      // Fallback to Netlify function if direct method fails
      try {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const emailFunctionUrl = `${frontendUrl}/.netlify/functions/verify-email`;
        
        await fetch(emailFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            username,
            verificationToken: emailVerificationToken
          })
        });
        console.log('✅ Verification email sent via Netlify function to:', email);
      } catch (netlifyError) {
        console.error('❌ Failed to send verification email via Netlify function:', netlifyError);
        // Don't fail registration if email fails
      }
    }

    // Return user data (without password)
    const userResponse = {
      userId,
      username,
      email,
      fullName: newUser.displayName,
      nickName: newUser.nickName,
      age: newUser.age,
      gender: newUser.gender,
      profilePicture: profilePictureUrl,
      profilePictureId: profilePictureId,
      bio: '',
      isEmailVerified: false
    };

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: userResponse,
      accessToken,
      refreshToken,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error name:', error.name);  
    console.error('Error message:', error.message);
    if (error.errInfo && error.errInfo.details) {
      console.error('Schema validation details:', JSON.stringify(error.errInfo.details, null, 2));
    }
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
}

// Login user
export async function login(req, res) {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    const { username, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'login');
    if (!recaptchaResult.success && !recaptchaResult.skipped && !recaptchaResult.serviceError) {
      return res.status(400).json({ error: 'Security verification failed. Please try again.' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Find user by username or email
    const user = await usersCollection.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      // Track failed attempt
      const { trackFailedAttempt } = await import('../server.js');
      trackFailedAttempt(clientIP);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    const now = new Date();
    if (user.accountLocked && user.accountLockedUntil && user.accountLockedUntil > now) {
      const remainingMinutes = Math.ceil((user.accountLockedUntil - now) / 1000 / 60);
      console.log(`🔒 Account locked: ${user.username} (${remainingMinutes} minutes remaining)`);
      return res.status(423).json({ 
        error: 'Account temporarily locked due to multiple failed login attempts.',
        lockedFor: `${remainingMinutes} minutes`,
        message: `Please try again in ${remainingMinutes} minutes or reset your password.`
      });
    }

    // If lock has expired, clear it
    if (user.accountLocked && user.accountLockedUntil && user.accountLockedUntil <= now) {
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            accountLocked: false,
            accountLockedUntil: null,
            failedLoginAttempts: 0,
            lastFailedLogin: null
          }
        }
      );
      console.log(`🔓 Account lock expired and cleared: ${user.username}`);
      user.accountLocked = false;
      user.failedLoginAttempts = 0;
    }

    // Check password (use passwordHash from schema)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Track failed attempt for IP blocking
      const { trackFailedAttempt } = await import('../server.js');
      trackFailedAttempt(clientIP);
      
      // Track failed login attempts for account lockout
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutThreshold = 5; // Lock after 5 failed attempts
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes
      
      const updateData = {
        failedLoginAttempts: failedAttempts,
        lastFailedLogin: new Date()
      };
      
      // Lock account if threshold reached
      if (failedAttempts >= lockoutThreshold) {
        updateData.accountLocked = true;
        updateData.accountLockedUntil = new Date(Date.now() + lockoutDuration);
        console.log(`🔒 Account locked: ${user.username} (${failedAttempts} failed attempts)`);
      }
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      
      // Return appropriate error message
      if (failedAttempts >= lockoutThreshold) {
        return res.status(423).json({ 
          error: 'Account locked due to multiple failed login attempts.',
          lockedFor: '30 minutes',
          attemptsRemaining: 0,
          message: 'Your account has been temporarily locked. Please try again in 30 minutes or reset your password.'
        });
      } else {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          attemptsRemaining: lockoutThreshold - failedAttempts,
          message: `Invalid credentials. ${lockoutThreshold - failedAttempts} attempts remaining before account lockout.`
        });
      }
    }

    // Check if user is suspended
    if (user.userSuspended) {
      console.log(`🚫 Suspended user attempted login: ${user.username}`);
      return res.status(403).json({ 
        error: 'Your account has been suspended.',
        suspended: true,
        suspendedAt: user.suspendedAt,
        reportCount: user.reports?.length || 0,
        message: 'Your account has been suspended due to multiple user reports. Please contact support if you believe this is an error.'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        requiresEmailVerification: true,
        email: user.email
      });
    }

    // Update last seen and status
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastSeen: new Date(), updatedAt: new Date(), status: 'online' } }
    );

    // Clear failed attempts on successful login (both IP and account)
    const { clearFailedAttempts } = await import('../server.js');
    clearFailedAttempts(clientIP);
    
    // Reset account lockout fields on successful login
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          accountLocked: false,
          accountLockedUntil: null
        }
      }
    );

    // Generate tokens
    const userId = user._id.toString();
    const accessToken = generateAccessToken(userId, user.username);
    const refreshToken = generateRefreshToken(userId);

    // Get profile picture URL if available (with cache-busting timestamp)
    let profilePictureUrl = null;
    if (user.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
    }

    // Return user data (without password)
    const userResponse = {
      userId,
      username: user.username,
      email: user.email,
      fullName: user.displayName,
      nickName: user.nickName || user.username,
      age: user.age,
      gender: user.gender,
      role: user.role || 'user',
      profilePicture: profilePictureUrl,
      profilePictureId: user.profilePictureId,
      bio: user.bio || ''
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Get current user
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile picture URL if available (with cache-busting timestamp)
    let profilePictureUrl = null;
    if (user.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
    }

    const userResponse = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.displayName,
      nickName: user.nickName || user.username,
      age: user.age,
      gender: user.gender,
      profilePicture: profilePictureUrl,
      profilePictureId: user.profilePictureId,
      bio: user.bio || '',
      createdAt: user.createdAt
    };

    res.json({ user: userResponse });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

// Verify email
export async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Find user with this token
    const user = await usersCollection.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token. Please register again.' 
      });
    }

    // Update user as verified
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Email verified for user: ${user.username}`);

    res.json({
      message: 'Email verified successfully! You can now log in.',
      success: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
}

// Get resend attempts count
export async function getResendAttempts(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');
    const siteSettingsCollection = db.collection('siteSettings');

    // Get site settings for max attempts
    const siteSettings = await siteSettingsCollection.findOne({ settingType: 'global' });
    const maxResendAttempts = siteSettings?.verificationEmailResendCount || 4;

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not, return default
      return res.json({
        remainingAttempts: maxResendAttempts,
        maxAttempts: maxResendAttempts,
        currentAttempt: 0
      });
    }

    const currentResendCount = user.emailResendCount || 0;
    const remainingAttempts = Math.max(0, maxResendAttempts - currentResendCount);

    res.json({
      remainingAttempts,
      maxAttempts: maxResendAttempts,
      currentAttempt: currentResendCount
    });

  } catch (error) {
    console.error('Get resend attempts error:', error);
    res.status(500).json({ error: 'Failed to get resend attempts' });
  }
}

// Resend verification email
export async function resendVerificationEmail(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');
    const siteSettingsCollection = db.collection('siteSettings');

    // Get site settings for resend limit
    const siteSettings = await siteSettingsCollection.findOne({ settingType: 'global' });
    const maxResendAttempts = siteSettings?.verificationEmailResendCount || 4;

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check resend count
    const currentResendCount = user.emailResendCount || 0;
    
    if (currentResendCount >= maxResendAttempts) {
      return res.status(429).json({ 
        error: 'Maximum verification email attempts reached',
        message: 'You have reached the maximum number of verification email attempts. Please contact the site administrator for assistance.',
        remainingAttempts: 0,
        maxAttempts: maxResendAttempts
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token and increment resend count
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken,
          emailVerificationExpires,
          updatedAt: new Date()
        },
        $inc: {
          emailResendCount: 1
        }
      }
    );

    const newResendCount = currentResendCount + 1;
    const remainingAttempts = maxResendAttempts - newResendCount;

    // Send verification email
    try {
      // Try direct email sending first
      await sendVerificationEmail(email, user.username, emailVerificationToken);
      console.log(`✅ Verification email resent to: ${email} (Attempt ${newResendCount}/${maxResendAttempts})`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email via direct method:', emailError);
      
      // Fallback to Netlify function if direct method fails
      try {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const emailFunctionUrl = `${frontendUrl}/.netlify/functions/verify-email`;
        
        await fetch(emailFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            username: user.username,
            verificationToken: emailVerificationToken
          })
        });
        console.log(`✅ Verification email resent via Netlify function to: ${email} (Attempt ${newResendCount}/${maxResendAttempts})`);
      } catch (netlifyError) {
        console.error('❌ Failed to resend verification email via Netlify function:', netlifyError);
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
    }

    res.json({
      message: `Verification email sent! Please check your inbox. (${remainingAttempts} attempts remaining)`,
      success: true,
      remainingAttempts,
      maxAttempts: maxResendAttempts,
      currentAttempt: newResendCount
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
}

// Logout user
export async function logout(req, res) {
  try {
    // In a production app, you might want to invalidate the refresh token here
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Update user profile
export async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { age, gender, nickName } = req.body;

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update object
    const updateData = {
      updatedAt: new Date()
    };

    // Update age if provided
    if (age) {
      const ageNum = parseInt(age);
      if (ageNum < 18 || ageNum > 100) {
        return res.status(400).json({ error: 'Age must be between 18 and 100' });
      }
      updateData.age = ageNum;
    }

    // Update gender if provided
    if (gender) {
      if (!['Male', 'Female'].includes(gender)) {
        return res.status(400).json({ error: 'Gender must be Male or Female' });
      }
      updateData.gender = gender;
    }

    // Update nickName if provided
    if (nickName !== undefined && nickName !== user.nickName) {
      // Validate nickName
      if (!nickName || nickName.trim().length === 0) {
        return res.status(400).json({ error: 'Nickname cannot be empty' });
      }

      if (nickName.length > 30) {
        return res.status(400).json({ error: 'Nickname must be 30 characters or less' });
      }

      // Check if nickName is already taken by another user
      const existingUser = await usersCollection.findOne({
        nickName: nickName,
        _id: { $ne: new ObjectId(userId) }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'This nickname is already taken by another user' });
      }

      updateData.nickName = nickName;
    }

    // Process and upload profile picture if provided
    if (req.file) {
      try {
        // Delete old profile picture if exists
        if (user.profilePictureId) {
          try {
            await storage.deleteFile(BUCKET_ID, user.profilePictureId);
            console.log(`✅ Deleted old profile picture: ${user.profilePictureId}`);
          } catch (deleteError) {
            console.error('Failed to delete old profile picture:', deleteError);
            // Continue even if deletion fails
          }
        }

        // Upload new profile picture
        const profilePictureId = await processAndUploadImage(req.file.buffer, user.username, userId);
        updateData.profilePictureId = profilePictureId;
      } catch (uploadError) {
        console.error('Failed to upload profile picture:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile picture' });
      }
    }

    // Update user in database
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    // Get profile picture URL if available (with cache-busting timestamp)
    let profilePictureUrl = null;
    if (updatedUser.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${updatedUser.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}&t=${Date.now()}`;
    }

    const userResponse = {
      userId: updatedUser._id.toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.displayName,
      nickName: updatedUser.nickName || updatedUser.username,
      lastNickNameChange: updatedUser.lastNickNameChange,
      age: updatedUser.age,
      gender: updatedUser.gender,
      profilePicture: profilePictureUrl,
      profilePictureId: updatedUser.profilePictureId,
      bio: updatedUser.bio || ''
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Change password
export async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password in database
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Password changed for user: ${user.username}`);

    res.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}
