import express from 'express';
import { register, login, getCurrentUser, logout, updateProfile, uploadMiddleware } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', uploadMiddleware, register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.put('/update-profile', authenticateToken, uploadMiddleware, updateProfile);

export default router;
