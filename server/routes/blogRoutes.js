import express from 'express';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { verifyAdmin } from '../middleware/auth.js';
import { syncBlogData, getBlogArticlesFromCache } from '../utils/syncBlogData.js';

const router = express.Router();

// Collection constants
const COLLECTION_ID = 'blog_articles';
const DATABASE_ID = '6901d5f00010cd2a48f1'; // Use existing database

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// GET /api/blog/admin/direct - Get all blog articles directly from Appwrite (ADMIN ONLY)
// IMPORTANT: This route MUST come before /:id route to avoid matching "admin" as an ID
router.get('/admin/direct', verifyAdmin, async (req, res) => {
  try {
    console.log('📖 Admin fetching articles directly from Appwrite (bypassing cache)...');
    
    // Read directly from Appwrite (no cache)
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );

    const articles = response.documents.map(doc => ({
      id: doc.articleId,
      title: doc.title,
      author: doc.author,
      date: doc.date,
      tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
      logo: doc.logo,
      excerpt: doc.excerpt,
      content: doc.content
    }));

    console.log(`✅ Fetched ${articles.length} articles directly from Appwrite`);
    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error fetching articles from Appwrite:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch articles from Appwrite',
      message: error.message 
    });
  }
});

// GET /api/blog - Get all blog articles (from cache for performance - PUBLIC)
router.get('/', async (req, res) => {
  try {
    // Read from JSON cache for fast performance
    const result = await getBlogArticlesFromCache();
    
    if (result.success) {
      res.json({ success: true, articles: result.articles });
    } else {
      // Fallback to Appwrite if cache read fails
      console.log('⚠️  Cache read failed, falling back to Appwrite');
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc('date'),
          Query.limit(100)
        ]
      );

      const articles = response.documents.map(doc => ({
        id: doc.articleId,
        title: doc.title,
        author: doc.author,
        date: doc.date,
        tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
        logo: doc.logo,
        excerpt: doc.excerpt,
        content: doc.content
      }));

      res.json({ success: true, articles });
    }
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blog articles',
      message: error.message 
    });
  }
});

// GET /api/blog/:id - Get a specific blog article (from cache for performance)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try reading from cache first
    const cacheResult = await getBlogArticlesFromCache();
    
    if (cacheResult.success) {
      const article = cacheResult.articles.find(a => a.id === id);
      if (article) {
        return res.json({ success: true, article });
      }
    }

    // Fallback to Appwrite if not in cache
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('articleId', id),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }

    const doc = response.documents[0];
    const article = {
      id: doc.articleId,
      title: doc.title,
      author: doc.author,
      date: doc.date,
      tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags,
      logo: doc.logo,
      excerpt: doc.excerpt,
      content: doc.content
    };

    res.json({ success: true, article });
  } catch (error) {
    console.error('Error fetching blog article:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blog article',
      message: error.message 
    });
  }
});

// POST /api/blog - Create a new blog article (Admin only)
// 1. Write to Appwrite (source of truth)
// 2. Sync to JSON cache
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { id, title, author, date, tags, logo, excerpt, content } = req.body;

    // Validate required fields
    if (!id || !title || !author || !date || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 1. Write to Appwrite FIRST (source of truth)
    const documentData = {
      articleId: id,
      title,
      author,
      date,
      tags: JSON.stringify(tags || []),
      logo: logo || '📝',
      excerpt,
      content
    };

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      documentData
    );

    console.log('✅ Article created in Appwrite:', title);
    
    // Trigger immediate sync so article appears right away
    syncBlogData().catch(err => console.error('⚠️  Background sync failed:', err));
    console.log('🔄 Triggered immediate cache sync');

    res.json({
      success: true, 
      message: 'Article created successfully',
      article: { id, title, author, date, tags, logo, excerpt, content }
    });
  } catch (error) {
    console.error('Error creating blog article:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create blog article',
      message: error.message 
    });
  }
});

// PUT /api/blog/:id - Update a blog article (Admin only)
// 1. Update in Appwrite (source of truth)
// 2. Sync to JSON cache
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, date, tags, logo, excerpt, content } = req.body;

    // 1. Find and update in Appwrite FIRST (source of truth)
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('articleId', id),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }

    const documentId = response.documents[0].$id;

    const documentData = {
      articleId: id,
      title,
      author,
      date,
      tags: JSON.stringify(tags || []),
      logo: logo || '📝',
      excerpt,
      content
    };

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      documentData
    );

    console.log('✅ Article updated in Appwrite:', title);
    
    // Trigger immediate sync so changes appear right away
    syncBlogData().catch(err => console.error('⚠️  Background sync failed:', err));
    console.log('🔄 Triggered immediate cache sync');

    res.json({
      success: true, 
      message: 'Article updated successfully',
      article: { id, title, author, date, tags, logo, excerpt, content }
    });
  } catch (error) {
    console.error('Error updating blog article:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update blog article',
      message: error.message 
    });
  }
});

// DELETE /api/blog/:id - Delete a blog article (Admin only)
// 1. Delete from Appwrite (source of truth)
// 2. Sync to JSON cache
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and delete from Appwrite FIRST (source of truth)
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('articleId', id),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }

    const documentId = response.documents[0].$id;
    const articleTitle = response.documents[0].title;

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );

    console.log('✅ Article deleted from Appwrite:', articleTitle);
    
    // Trigger immediate sync so deletion appears right away
    syncBlogData().catch(err => console.error('⚠️  Background sync failed:', err));
    console.log('🔄 Triggered immediate cache sync');

    res.json({
      success: true, 
      message: 'Article deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting blog article:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete blog article',
      message: error.message 
    });
  }
});

export default router;
