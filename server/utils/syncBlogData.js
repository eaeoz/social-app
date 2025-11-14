import { Client, Databases, ID, Query } from 'node-appwrite';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Collection constants
const COLLECTION_ID = 'blog_articles';
const DATABASE_ID = '6901d5f00010cd2a48f1'; // Use existing database

export async function syncBlogData() {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    console.log('🔄 Starting blog data sync...');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../data/blogArticles.json');
    const jsonData = await fs.readFile(jsonPath, 'utf8');
    const articles = JSON.parse(jsonData);

    console.log(`📚 Found ${articles.length} articles in JSON file`);

    // Get existing articles from Appwrite
    let existingArticles = [];
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(100)]
      );
      existingArticles = response.documents;
      console.log(`📊 Found ${existingArticles.length} articles in Appwrite`);
    } catch (error) {
      console.log('⚠️  Could not fetch existing articles:', error.message);
    }

    // Create a map of existing articles by articleId
    const existingMap = new Map();
    existingArticles.forEach(article => {
      existingMap.set(article.articleId, article.$id);
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Sync each article
    for (const article of articles) {
      try {
        const documentId = existingMap.get(article.id);

        // Prepare the document data
        const documentData = {
          articleId: article.id,
          title: article.title,
          author: article.author,
          date: article.date,
          tags: JSON.stringify(article.tags),
          logo: article.logo,
          excerpt: article.excerpt,
          content: article.content
        };

        if (documentId) {
          // Update existing document
          try {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTION_ID,
              documentId,
              documentData
            );
            console.log(`✅ Updated: "${article.title}"`);
            updated++;
          } catch (error) {
            console.error(`❌ Failed to update "${article.title}":`, error.message);
            skipped++;
          }
        } else {
          // Create new document
          try {
            await databases.createDocument(
              DATABASE_ID,
              COLLECTION_ID,
              ID.unique(),
              documentData
            );
            console.log(`✅ Created: "${article.title}"`);
            created++;
          } catch (error) {
            console.error(`❌ Failed to create "${article.title}":`, error.message);
            skipped++;
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing article "${article.title}":`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('🎉 Blog data sync completed!\n');

    return { created, updated, skipped, success: true };

  } catch (error) {
    console.error('❌ Error syncing blog data:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    return { created: 0, updated: 0, skipped: 0, success: false, error: error.message };
  }
}
