import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import sharp from 'sharp';
import { InputFile } from 'node-appwrite';
import { storage, BUCKET_ID } from '../config/appwrite.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

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
    // Process image: resize to 80x80 and convert to JPG
    const processedBuffer = await sharp(buffer)
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

    // Upload to Appwrite
    const file = InputFile.fromBuffer(processedBuffer, filename);
    
    const result = await storage.createFile(
      BUCKET_ID,
      filename, // Use sanitized username_userId as file ID
      file
    );

    console.log(`✅ Profile picture uploaded: ${result.$id}`);
    return result.$id;
  } catch (error) {
    console.error('❌ Error processing/uploading image:', error);
    throw error;
  }
}

// Register new user
export async function register(req, res) {
  try {
    const { username, email, password, fullName, age, gender } = req.body;

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

    // Create user first (matching MongoDB schema)
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      displayName: fullName || username,
      age: parseInt(age),
      gender,
      bio: '',
      status: 'offline',
      profilePictureId: null,
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

    // Return user data (without password)
    const userResponse = {
      userId,
      username,
      email,
      fullName: newUser.displayName,
      profilePicture: profilePictureUrl,
      profilePictureId: profilePictureId,
      bio: ''
    };

    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      accessToken,
      refreshToken
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
  try {
    const { username, password } = req.body;

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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (use passwordHash from schema)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last seen and status
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastSeen: new Date(), updatedAt: new Date(), status: 'online' } }
    );

    // Generate tokens
    const userId = user._id.toString();
    const accessToken = generateAccessToken(userId, user.username);
    const refreshToken = generateRefreshToken(userId);

    // Get profile picture URL if available
    let profilePictureUrl = null;
    if (user.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
    }

    // Return user data (without password)
    const userResponse = {
      userId,
      username: user.username,
      email: user.email,
      fullName: user.displayName,
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

    // Get profile picture URL if available
    let profilePictureUrl = null;
    if (user.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${user.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
    }

    const userResponse = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.displayName,
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
    const { age, gender } = req.body;

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

    // Get profile picture URL if available
    let profilePictureUrl = null;
    if (updatedUser.profilePictureId) {
      profilePictureUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${updatedUser.profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
    }

    const userResponse = {
      userId: updatedUser._id.toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.displayName,
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
