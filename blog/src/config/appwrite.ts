import { Client, Databases } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const databases = new Databases(client);

export const config = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  articlesCollectionId: import.meta.env.VITE_APPWRITE_ARTICLES_COLLECTION_ID || '',
};

export default client;
