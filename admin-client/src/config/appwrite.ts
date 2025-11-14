import { Client, Databases } from 'appwrite';

// Appwrite configuration
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

// Collection constants
export const DATABASE_ID = '6901d5f00010cd2a48f1';
export const COLLECTION_ID = 'blog_articles';

export { client, databases };
