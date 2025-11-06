import { Client, Storage, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Initialize storage
const storage = new Storage(client);

const BUCKET_ID = process.env.APPWRITE_BUCKET_ID;

// Upload profile picture
export async function uploadProfilePicture(file, userId) {
  try {
    const fileId = `user_${userId}_${Date.now()}`;
    
    const result = await storage.createFile(
      BUCKET_ID,
      fileId,
      file
    );

    console.log(`✅ Profile picture uploaded: ${result.$id}`);
    return result.$id;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error.message);
    throw error;
  }
}

// Get profile picture URL
export function getProfilePictureUrl(fileId) {
  if (!fileId) return null;
  
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
}

// Delete profile picture
export async function deleteProfilePicture(fileId) {
  try {
    await storage.deleteFile(BUCKET_ID, fileId);
    console.log(`🗑️ Profile picture deleted: ${fileId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting profile picture:', error.message);
    throw error;
  }
}

// Upload attachment (for messages)
export async function uploadAttachment(file, userId) {
  try {
    const fileId = `attachment_${userId}_${Date.now()}`;
    
    const result = await storage.createFile(
      BUCKET_ID,
      fileId,
      file
    );

    console.log(`✅ Attachment uploaded: ${result.$id}`);
    return {
      fileId: result.$id,
      fileName: result.name,
      fileSize: result.sizeOriginal,
      mimeType: result.mimeType
    };
  } catch (error) {
    console.error('❌ Error uploading attachment:', error.message);
    throw error;
  }
}

// Get attachment URL
export function getAttachmentUrl(fileId) {
  if (!fileId) return null;
  
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
}

// Get file download URL
export function getFileDownloadUrl(fileId) {
  if (!fileId) return null;
  
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${process.env.APPWRITE_PROJECT_ID}`;
}

console.log('✅ Appwrite configuration initialized');

export { client, storage, BUCKET_ID };
