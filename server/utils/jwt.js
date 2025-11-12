import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getSiteSettings } from './initializeSiteSettings.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Generate access token with configurable expiration from database
export async function generateAccessToken(userId, username) {
  try {
    // Get session timeout from database (in MINUTES)
    const settings = await getSiteSettings();
    const sessionTimeoutMinutes = settings.sessionTimeout || 10080; // Default to 10080 minutes (7 days) if not set
    
    console.log(`🔑 Generating JWT with ${sessionTimeoutMinutes} minutes expiration (from database)`);
    
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: `${sessionTimeoutMinutes}m` }
    );
  } catch (error) {
    // Fallback to 7 days
    const fallbackMinutes = 10080; // 7 days
    console.warn(`⚠️ Failed to get session timeout from database, using fallback: ${fallbackMinutes} minutes`);
    
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: `${fallbackMinutes}m` }
    );
  }
}

// Generate refresh token (4x session timeout)
export async function generateRefreshToken(userId) {
  try {
    // Get session timeout from database (in MINUTES)
    const settings = await getSiteSettings();
    const sessionTimeoutMinutes = settings.sessionTimeout || 10080; // Default 7 days
    const refreshTimeoutMinutes = sessionTimeoutMinutes * 4; // 4x the session timeout
    
    console.log(`🔑 Generating refresh token with ${refreshTimeoutMinutes} minutes expiration`);
    
    return jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: `${refreshTimeoutMinutes}m` }
    );
  } catch (error) {
    // Fallback to 30 days
    const fallbackMinutes = 43200; // 30 days
    console.warn(`⚠️ Failed to get session timeout from database, using fallback: ${fallbackMinutes} minutes`);
    
    return jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: `${fallbackMinutes}m` }
    );
  }
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}
