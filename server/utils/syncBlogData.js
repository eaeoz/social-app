import { Client, Databases, Query } from 'node-appwrite';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Collection constants
const COLLECTION_ID = 'blog_articles';
const DATABASE_ID = '6901d5f00010cd2a48f1'; // Use existing database

/**
 * Generate sitemap after blog data changes
 */
async function generateSitemap() {
  try {
    const clientPath = path.join(__dirname, '../../client');
    const sitemapScript = path.join(clientPath, 'scripts/generate-sitemap.js');
    
    console.log('🗺️  Regenerating sitemap...');
    
    // Check if sitemap script exists
    try {
      await fs.access(sitemapScript);
    } catch {
      console.log('⚠️  Sitemap script not found, skipping sitemap generation');
      return { success: false, error: 'Sitemap script not found' };
    }
    
    // Run the sitemap generation script
    const { stdout, stderr } = await execAsync(`node "${sitemapScript}"`, {
      cwd: clientPath
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Sitemap regenerated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync blog data FROM Appwrite TO local JSON file
 * Appwrite is the source of truth - JSON is just a cache for fast reads
 */
export async function syncBlogData() {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    console.log('🔄 Starting blog data sync (Appwrite → JSON cache)...');

    // Fetch all articles from Appwrite (source of truth)
    let allArticles = [];
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(100), Query.orderDesc('$createdAt')]
      );
      allArticles = response.documents;
      console.log(`📊 Found ${allArticles.length} articles in Appwrite`);
      
      // Don't overwrite cache with empty data unless it's intentional
      if (allArticles.length === 0) {
        console.log('⚠️  Warning: Appwrite returned 0 articles. Checking if this is expected...');
        // Check if cache exists and has articles
        const jsonPath = path.join(__dirname, '../data/blogArticles.json');
        try {
          const existingData = await fs.readFile(jsonPath, 'utf8');
          const existingArticles = JSON.parse(existingData);
          if (existingArticles.length > 0) {
            console.log(`⚠️  Cache has ${existingArticles.length} articles but Appwrite has 0. Skipping sync to prevent data loss.`);
            return { success: false, error: 'Appwrite returned empty but cache has data', articlesCount: existingArticles.length };
          }
        } catch {
          // Cache doesn't exist or is invalid, proceed with empty sync
        }
      }
    } catch (error) {
      console.error('❌ Could not fetch articles from Appwrite:', error.message);
      console.error('❌ Full error:', error);
      return { success: false, error: error.message, articlesCount: 0 };
    }

    // Transform Appwrite documents to JSON format
    const articlesForJson = allArticles.map(doc => ({
      id: doc.articleId,
      title: doc.title,
      author: doc.author,
      date: doc.date,
      tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
      logo: doc.logo,
      excerpt: doc.excerpt,
      content: doc.content,
      // Keep Appwrite metadata for reference
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    }));

    // Write to JSON file (cache)
    const jsonPath = path.join(__dirname, '../data/blogArticles.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(jsonPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }

    await fs.writeFile(jsonPath, JSON.stringify(articlesForJson, null, 2), 'utf8');
    console.log(`✅ Updated JSON cache with ${articlesForJson.length} articles`);

    // Regenerate sitemap after updating articles
    const sitemapResult = await generateSitemap();

    console.log('\n📊 Sync Summary:');
    console.log(`   📝 Articles synced: ${articlesForJson.length}`);
    console.log(`   💾 Cache updated: ${jsonPath}`);
    console.log(`   🗺️  Sitemap updated: ${sitemapResult.success ? 'Yes' : 'No'}`);
    console.log('🎉 Blog data sync completed!\n');

    return { 
      success: true, 
      articlesCount: articlesForJson.length,
      cacheFile: jsonPath,
      sitemapGenerated: sitemapResult.success
    };

  } catch (error) {
    console.error('❌ Error syncing blog data:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    return { 
      success: false, 
      error: error.message, 
      articlesCount: 0 
    };
  }
}

/**
 * Get blog articles from JSON cache (fast read)
 * If cache doesn't exist, fetch from Appwrite and create cache
 */
export async function getBlogArticlesFromCache() {
  try {
    const jsonPath = path.join(__dirname, '../data/blogArticles.json');
    
    try {
      const jsonData = await fs.readFile(jsonPath, 'utf8');
      const articles = JSON.parse(jsonData);
      console.log(`📚 Loaded ${articles.length} articles from cache`);
      return { success: true, articles };
    } catch (error) {
      // Cache doesn't exist, sync from Appwrite
      console.log('⚠️  Cache not found, syncing from Appwrite...');
      const syncResult = await syncBlogData();
      
      if (syncResult.success) {
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const articles = JSON.parse(jsonData);
        return { success: true, articles };
      } else {
        return { success: false, articles: [], error: 'Failed to sync from Appwrite' };
      }
    }
  } catch (error) {
    console.error('❌ Error reading blog articles from cache:', error.message);
    return { success: false, articles: [], error: error.message };
  }
}
