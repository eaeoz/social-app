// Check user script
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'social-app';

async function checkUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB_NAME);
    const user = await db.collection('users').findOne({ username: 'testuser' });
    
    if (!user) {
      console.log('❌ User "testuser" not found!');
      console.log('You need to register this user first on the mobile app.');
      return;
    }
    
    console.log('✅ User "testuser" found!\n');
    console.log('📧 Email:', user.email);
    console.log('✉️ Email Verified:', user.isEmailVerified);
    console.log('🔑 Has Verification Token:', !!user.emailVerificationToken);
    console.log('⏰ Token Expires:', user.emailVerificationExpires);
    console.log('📅 Created At:', user.createdAt);
    console.log('🔄 Email Resend Count:', user.emailResendCount || 0);
    
    if (!user.isEmailVerified) {
      console.log('\n⚠️ Email NOT verified yet!');
      
      if (user.emailVerificationToken) {
        console.log('✅ Verification token exists - email was sent during registration');
        console.log('\nTo resend verification email, use:');
        console.log('POST /api/auth/resend-verification-email');
        console.log(`Body: {"email": "${user.email}", "password": "your-password"}`);
      } else {
        console.log('❌ No verification token - user registered before SMTP was configured');
        console.log('User needs to register again!');
      }
    } else {
      console.log('\n✅ Email already verified! User can login.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUser();
