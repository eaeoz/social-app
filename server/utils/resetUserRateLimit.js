/**
 * Emergency Reset Rate Limit Utility
 * 
 * This script resets rate limiting and account lockout data for users.
 * Use this in emergency situations when users are locked out.
 * 
 * Usage:
 * 1. Reset all users: node server/utils/resetUserRateLimit.js --all
 * 2. Reset specific user: node server/utils/resetUserRateLimit.js --username <username>
 * 3. Reset by email: node server/utils/resetUserRateLimit.js --email <email>
 */

import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database.js';

dotenv.config();

async function resetRateLimit(options = {}) {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let filter = {};
    let description = '';

    if (options.all) {
      // Reset all users
      description = 'all users';
    } else if (options.username) {
      // Reset specific user by username
      filter = { username: options.username };
      description = `user: ${options.username}`;
    } else if (options.email) {
      // Reset specific user by email
      filter = { email: options.email };
      description = `user with email: ${options.email}`;
    } else {
      console.error('Error: Please specify --all, --username, or --email');
      process.exit(1);
    }

    // Fields to reset
    const updateData = {
      $unset: {
        loginAttempts: "",
        lockUntil: "",
        rateLimitData: ""
      }
    };

    const result = await usersCollection.updateMany(filter, updateData);

    console.log('\n✅ Rate Limit Reset Complete!');
    console.log(`📊 Target: ${description}`);
    console.log(`🔄 Users updated: ${result.modifiedCount}`);
    console.log('\nThe following data has been cleared:');
    console.log('  • Login attempts counter');
    console.log('  • Account lockout timestamp');
    console.log('  • Rate limiting data');
    console.log('\nUsers can now attempt to login again.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error resetting rate limit:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--all') {
    options.all = true;
  } else if (args[i] === '--username' && args[i + 1]) {
    options.username = args[i + 1];
    i++;
  } else if (args[i] === '--email' && args[i + 1]) {
    options.email = args[i + 1];
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Emergency Reset Rate Limit Utility
===================================

This script resets rate limiting and account lockout data for users.
Use this in emergency situations when users are locked out.

Usage:
  node server/utils/resetUserRateLimit.js [options]

Options:
  --all                Reset rate limit for ALL users
  --username <name>    Reset rate limit for specific username
  --email <email>      Reset rate limit for specific email
  --help, -h          Show this help message

Examples:
  # Reset all users
  node server/utils/resetUserRateLimit.js --all

  # Reset specific user by username
  node server/utils/resetUserRateLimit.js --username johndoe

  # Reset specific user by email
  node server/utils/resetUserRateLimit.js --email user@example.com

What gets reset:
  • Login attempts counter
  • Account lockout timestamp
  • Rate limiting data

After running this script, users will be able to attempt login again.
    `);
    process.exit(0);
  }
}

// Run the reset
resetRateLimit(options);
