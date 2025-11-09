import express from 'express';
import { register, login, getCurrentUser, logout, updateProfile, uploadMiddleware, verifyEmail, resendVerificationEmail, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', uploadMiddleware, register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.put('/update-profile', authenticateToken, uploadMiddleware, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
