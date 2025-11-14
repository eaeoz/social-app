import { verifyAccessToken } from '../utils/jwt.js';
import { getDatabase } from '../config/database.js';
import { ObjectId } from 'mongodb';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    // Check if user is suspended
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { userSuspended: 1, suspendedAt: 1 } }
    );

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    if (user.userSuspended) {
      console.log(`🚫 Suspended user attempted to access protected route: ${decoded.username}`);
      return res.status(403).json({ 
        error: 'Your account has been suspended.',
        suspended: true,
        suspendedAt: user.suspendedAt,
        message: 'Your account has been suspended due to multiple user reports. Please contact support if you believe this is an error.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

export async function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { role: 1, userSuspended: 1 } }
    );

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    if (user.userSuspended) {
      return res.status(403).json({ 
        error: 'Your account has been suspended.',
        suspended: true
      });
    }

    if (user.role !== 'admin') {
      console.log(`🚫 Non-admin user attempted to access admin route: ${decoded.username}`);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    req.user = decoded;
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
