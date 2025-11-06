import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ObjectId } from 'mongodb';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

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

    // Create user (matching MongoDB schema)
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      displayName: fullName || username,
      age: parseInt(age),
      gender,
      bio: '',
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

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

    // Return user data (without password)
    const userResponse = {
      userId,
      username,
      email,
      fullName: newUser.displayName,
      profilePicture: null,
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

    // Return user data (without password)
    const userResponse = {
      userId,
      username: user.username,
      email: user.email,
      fullName: user.displayName,
      profilePicture: user.profilePictureId,
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

    const userResponse = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.displayName,
      profilePicture: user.profilePictureId,
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
