import { connectToDatabase, getDatabase } from '../config/database.js';

async function checkSiteSettings() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    
    console.log('🔍 Checking all documents in siteSettings collection...');
    
    const allSettings = await db.collection('siteSettings').find({}).toArray();
    
    console.log(`📊 Found ${allSettings.length} document(s) in siteSettings collection`);
    
    if (allSettings.length === 0) {
      console.log('⚠️ No documents found in siteSettings collection');
      console.log('💡 Creating initial settings document...');
      
      const newSettings = {
        settingType: 'global',
        showuserlistpicture: 1,
        searchUserCount: 4,
        defaultUsersDisplayCount: 3,
        siteEmail: 'sedatergoz@gmail.com',
        maxReportCount: 3,
        maxMessageLength: 100,
        rateLimit: 20,
        maintenanceMode: false,
        sessionTimeout: 1440,
        cleanMinSize: 500,
        cleanCycle: 129600, // minutes (90 days)
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('siteSettings').insertOne(newSettings);
      console.log('✅ Created new settings document with cleanup settings');
    } else {
      console.log('\n📋 Current settings documents:');
      allSettings.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
      
      // Update the first document if it exists
      console.log('\n🔧 Updating cleanup settings to use minutes...');
      const result = await db.collection('siteSettings').updateOne(
        { _id: allSettings[0]._id },
        {
          $set: {
            cleanMinSize: 500,
            cleanCycle: 129600, // minutes (90 days)
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully added cleanup settings');
        const updated = await db.collection('siteSettings').findOne({ _id: allSettings[0]._id });
        console.log('\n📋 Updated settings:');
        console.log(JSON.stringify(updated, null, 2));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSiteSettings();
