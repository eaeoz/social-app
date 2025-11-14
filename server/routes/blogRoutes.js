import express from 'express';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { verifyAdmin } from '../middleware/auth.js';

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

// GET /api/blog - Get all blog articles
router.get('/', async (req, res) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('date'),
        Query.limit(100)
      ]
    );

    // Transform documents to match frontend format
    const articles = response.documents.map(doc => ({
      id: doc.articleId,
      title: doc.title,
      author: doc.author,
      date: doc.date,
      tags: JSON.parse(doc.tags),
      logo: doc.logo,
      excerpt: doc.excerpt,
      content: doc.content
    }));

    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blog articles',
      message: error.message 
    });
  }
});

// GET /api/blog/:id - Get a specific blog article
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      tags: JSON.parse(doc.tags),
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

    // Create the document
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
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, date, tags, logo, excerpt, content } = req.body;

    // Find the document by articleId
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

    // Update the document
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
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the document by articleId
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

    // Delete the document
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );

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
