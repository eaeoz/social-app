import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',  // Force account selection every time
    accessType: 'offline'       // Request refresh token
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // Check if user is suspended
      if (user.userSuspended) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=suspended`);
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { 
          userId: user._id.toString(),
          username: user.username,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { 
          userId: user._id.toString(),
          username: user.username 
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Prepare user data (remove sensitive info)
      const userData = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      };

      // Redirect to frontend with tokens in URL params (will be extracted by frontend)
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?` +
        `token=${encodeURIComponent(accessToken)}&` +
        `refresh=${encodeURIComponent(refreshToken)}&` +
        `user=${encodeURIComponent(JSON.stringify(userData))}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

export default router;
