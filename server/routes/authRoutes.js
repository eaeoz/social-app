import express from 'express';
import { register, login, getCurrentUser, logout, updateProfile, uploadMiddleware, verifyEmail, resendVerificationEmail, getResendAttempts, changePassword, resetPassword, updateDoNotDisturb } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', uploadMiddleware, register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/get-resend-attempts', getResendAttempts);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.put('/update-profile', authenticateToken, uploadMiddleware, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.put('/update-dnd', authenticateToken, updateDoNotDisturb);

export default router;
