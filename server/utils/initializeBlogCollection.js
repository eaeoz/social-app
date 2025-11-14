import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const COLLECTION_ID = 'blog_articles';
const DATABASE_ID = '6901d5f00010cd2a48f1'; // Use existing database

async function initializeBlogCollection() {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    console.log('🚀 Starting blog collection initialization...');
    console.log('📡 Appwrite Endpoint:', process.env.APPWRITE_ENDPOINT);
    console.log('🔑 Project ID:', process.env.APPWRITE_PROJECT_ID);

    // Step 1: Create database if it doesn't exist
    console.log('\n📦 Step 1: Checking/Creating database...');
    try {
      await databases.get(DATABASE_ID);
      console.log('✅ Database "main" already exists');
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️  Database not found, creating...');
        await databases.create(DATABASE_ID, 'main');
        console.log('✅ Database "main" created successfully');
      } else {
        throw error;
      }
    }

    // Step 2: Create collection if it doesn't exist
    console.log('\n📚 Step 2: Checking/Creating blog collection...');
    try {
      await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log('✅ Collection "blog_articles" already exists');
      console.log('⚠️  Skipping creation to avoid conflicts');
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️  Collection not found, creating...');
        
        await databases.createCollection(
          DATABASE_ID,
          COLLECTION_ID,
          'Blog Articles',
          [
            Permission.read(Role.any()),
            Permission.write(Role.users())
          ],
          false, // documentSecurity
          true   // enabled
        );
        console.log('✅ Collection "blog_articles" created successfully');

        // Step 3: Create attributes
        console.log('\n🏗️  Step 3: Creating attributes...');

        // articleId - unique identifier
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'articleId',
          50,
          true // required
        );
        console.log('  ✅ Created: articleId (string, 50 chars, required)');

        // title
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'title',
          255,
          true
        );
        console.log('  ✅ Created: title (string, 255 chars, required)');

        // author
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'author',
          100,
          true
        );
        console.log('  ✅ Created: author (string, 100 chars, required)');

        // date
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'date',
          50,
          true
        );
        console.log('  ✅ Created: date (string, 50 chars, required)');

        // tags (stored as JSON string)
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'tags',
          500,
          true
        );
        console.log('  ✅ Created: tags (string, 500 chars, required)');

        // logo
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'logo',
          10,
          false
        );
        console.log('  ✅ Created: logo (string, 10 chars, optional)');

        // excerpt
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'excerpt',
          500,
          true
        );
        console.log('  ✅ Created: excerpt (string, 500 chars, required)');

        // content (large text field)
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          'content',
          50000,
          true
        );
        console.log('  ✅ Created: content (string, 50000 chars, required)');

        // Wait for attributes to be available
        console.log('\n⏳ Waiting for attributes to be available...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Create indexes
        console.log('\n🔍 Step 4: Creating indexes...');

        try {
          await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'articleId_index',
            'key',
            ['articleId'],
            ['asc']
          );
          console.log('  ✅ Created: articleId_index (unique key)');
        } catch (error) {
          console.log('  ⚠️  Index may already exist or attributes not ready yet');
        }

        try {
          await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'date_index',
            'key',
            ['date'],
            ['desc']
          );
          console.log('  ✅ Created: date_index (for sorting)');
        } catch (error) {
          console.log('  ⚠️  Index may already exist or attributes not ready yet');
        }

        console.log('\n🎉 Blog collection initialized successfully!');
        console.log('\n📋 Next steps:');
        console.log('  1. Run: node server/utils/syncBlogData.js');
        console.log('  2. Start your server: npm run dev');
        console.log('  3. Open the blog in your app!');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n❌ Error initializing blog collection:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the initialization
initializeBlogCollection();
