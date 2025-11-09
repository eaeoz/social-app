import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getDatabase } from './database.js';
import { ObjectId } from 'mongodb';

export function configurePassport() {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const db = getDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy - Only initialize if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
        },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const db = getDatabase();
          const usersCollection = db.collection('users');

          // Extract user info from Google profile
          const email = profile.emails[0].value;
          const displayName = profile.displayName;
          const googleId = profile.id;
          const profilePicture = profile.photos[0]?.value;

          // Check if user already exists
          let user = await usersCollection.findOne({ 
            $or: [
              { email: email },
              { googleId: googleId }
            ]
          });

          if (user) {
            // Update existing user with Google info if not present
            if (!user.googleId) {
              await usersCollection.updateOne(
                { _id: user._id },
                { 
                  $set: { 
                    googleId: googleId,
                    isEmailVerified: true, // Google emails are verified
                    profilePictureUrl: profilePicture,
                    updatedAt: new Date()
                  }
                }
              );
              user.googleId = googleId;
              user.isEmailVerified = true;
            }
            return done(null, user);
          }

          // Create new user
          const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
          
          const newUser = {
            username: username,
            email: email,
            displayName: displayName,
            googleId: googleId,
            profilePictureUrl: profilePicture,
            passwordHash: null, // No password for OAuth users
            age: null,
            gender: null,
            bio: '',
            status: 'offline',
            profilePictureId: null,
            isEmailVerified: true, // Google emails are automatically verified
            emailVerificationToken: null,
            emailVerificationExpires: null,
            reports: [],
            userSuspended: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSeen: new Date()
          };

          const result = await usersCollection.insertOne(newUser);
          const userId = result.insertedId;

          // Create user presence record
          await db.collection('userpresence').insertOne({
            userId,
            isOnline: false,
            lastSeen: new Date()
          });

          // Create default settings
          await db.collection('settings').insertOne({
            userId,
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

          // Fetch the created user
          const createdUser = await usersCollection.findOne({ _id: userId });
          
          done(null, createdUser);
        } catch (error) {
          console.error('Google OAuth error:', error);
          done(error, null);
        }
        }
      )
    );
  } else {
    console.log('ℹ️  Google OAuth not configured - skipping Google authentication strategy');
  }

  return passport;
}
