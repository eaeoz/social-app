import { getDatabase } from '../config/database.js';

/**
 * Add siteEmail field to existing siteSettings document
 * Run this script once to update existing database
 */
async function addSiteEmailField() {
  try {
    const db = getDatabase();
    const settingsCollection = db.collection('sitesettings');

    // Check if settings exist
    const existingSettings = await settingsCollection.findOne({ settingType: 'global' });

    if (!existingSettings) {
      console.log('ℹ️  No site settings found. They will be created automatically on server start.');
      return;
    }

    // Check if siteEmail field already exists
    if (existingSettings.siteEmail !== undefined) {
      console.log('ℹ️  siteEmail field already exists in site settings');
      console.log(`   Current value: ${existingSettings.siteEmail || '(empty)'}`);
      return;
    }

    // Add siteEmail field
    await settingsCollection.updateOne(
      { settingType: 'global' },
      {
        $set: {
          siteEmail: '',
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Successfully added siteEmail field to site settings');
    console.log('   Default value: (empty)');
    console.log('');
    console.log('📝 To configure the contact form recipient email:');
    console.log('   1. Go to your MongoDB database');
    console.log('   2. Find the sitesettings collection');
    console.log('   3. Update the siteEmail field with your email address');
    console.log('   Example: { "siteEmail": "your-email@example.com" }');

  } catch (error) {
    console.error('❌ Error adding siteEmail field:', error);
    throw error;
  }
}

// Export for use in other scripts
export { addSiteEmailField };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSiteEmailField()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}
