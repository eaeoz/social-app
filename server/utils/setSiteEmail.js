import { getDatabase, connectToDatabase } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Set siteEmail field in siteSettings
 */
async function setSiteEmail(email) {
  try {
    // Connect to database
    await connectToDatabase();
    
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Check if settings exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (!existingSettings) {
      console.log('⚠️  No site settings found. Creating new settings...');
      
      // Create new settings with siteEmail
      await settingsCollection.insertOne({
        settingType: 'global',
        showuserlistpicture: 1,
        searchUserCount: 50,
        defaultUsersDisplayCount: 20,
        siteEmail: email,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created new site settings with siteEmail');
    } else {
      // Update existing settings
      await settingsCollection.updateOne(
        { settingType: 'global' },
        {
          $set: {
            siteEmail: email,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Updated site settings with siteEmail');
    }

    console.log(`📧 siteEmail set to: ${email}`);
    console.log('');
    console.log('✅ Contact form is now configured!');
    console.log('   Users can now send you messages via the contact form.');

  } catch (error) {
    console.error('❌ Error setting siteEmail:', error);
    throw error;
  }
}

// Run with the email address
const EMAIL = 'sedatergoz@gmail.com';

setSiteEmail(EMAIL)
  .then(() => {
    console.log('\n✅ Configuration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Configuration failed:', error);
    process.exit(1);
  });
