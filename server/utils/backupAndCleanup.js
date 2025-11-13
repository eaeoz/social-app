import { getDatabase } from '../config/database.js';
import { getSiteSettings } from './initializeSiteSettings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create backups directory if it doesn't exist
 */
function ensureBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('✅ Created backups directory');
  }
  return backupDir;
}

/**
 * Backup collection to JSON file
 */
async function backupCollection(collectionName, targetDate) {
  try {
    const db = getDatabase();
    const collection = db.collection(collectionName);
    
    // Use the appropriate date field based on collection
    const dateField = collectionName === 'messages' ? 'timestamp' : 'createdAt';
    
    // Get documents older than targetDate
    const documents = await collection.find({
      [dateField]: { $lt: targetDate }
    }).toArray();

    if (documents.length === 0) {
      console.log(`ℹ️ No old documents found in ${collectionName} to backup`);
      return { backedUp: 0, filePath: null };
    }

    // Create backup directory
    const backupDir = ensureBackupDirectory();
    
    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${collectionName}_${timestamp}.json`;
    const filePath = path.join(backupDir, filename);

    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
    
    console.log(`✅ Backed up ${documents.length} documents from ${collectionName} to ${filename}`);
    return { backedUp: documents.length, filePath };
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete old messages from collection
 */
async function deleteOldMessages(collectionName, targetDate) {
  try {
    const db = getDatabase();
    const collection = db.collection(collectionName);
    
    // Use the appropriate date field based on collection
    const dateField = collectionName === 'messages' ? 'timestamp' : 'createdAt';
    
    const result = await collection.deleteMany({
      [dateField]: { $lt: targetDate }
    });

    console.log(`✅ Deleted ${result.deletedCount} old messages from ${collectionName}`);
    return result.deletedCount;
  } catch (error) {
    console.error(`❌ Error deleting from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get current database storage size in MB
 */
async function getStorageSize() {
  try {
    const db = getDatabase();
    const stats = await db.stats();
    
    const storageSizeMB = (stats.dataSize + stats.indexSize) / (1024 * 1024);
    
    return {
      totalMB: storageSizeMB,
      dataSizeMB: stats.dataSize / (1024 * 1024),
      indexSizeMB: stats.indexSize / (1024 * 1024)
    };
  } catch (error) {
    console.error('❌ Error getting storage size:', error);
    throw error;
  }
}

/**
 * Manual cleanup - backup and delete old messages
 */
export async function manualCleanup() {
  try {
    console.log('🧹 Starting manual cleanup...');
    
    // Get settings
    const settings = await getSiteSettings();
    const cleanCycleMinutes = settings.cleanCycle || 129600; // Default: 129600 minutes = 90 days
    
    // Calculate target date (messages older than cleanCycle minutes)
    const targetDate = new Date();
    targetDate.setTime(targetDate.getTime() - (cleanCycleMinutes * 60 * 1000));
    
    const cleanCycleDays = (cleanCycleMinutes / 60 / 24).toFixed(1);
    console.log(`📅 Cleaning messages older than ${cleanCycleMinutes} minutes (${cleanCycleDays} days) - before ${targetDate.toISOString()}`);
    
    // Backup all messages (includes both public and private message content)
    const messagesBackup = await backupCollection('messages', targetDate);
    
    // Backup private chat room metadata (chat room info, not the messages themselves)
    const privatechatsBackup = await backupCollection('privatechats', targetDate);
    
    // Delete old messages (this includes both public and private message content)
    const messagesDeleted = await deleteOldMessages('messages', targetDate);
    
    // Delete old private chat rooms (only the chat room metadata)
    const privatechatsDeleted = await deleteOldMessages('privatechats', targetDate);
    
    // Get storage size after cleanup
    const storageAfter = await getStorageSize();
    
    return {
      success: true,
      cleanCycleDays: cleanCycleMinutes,
      targetDate,
      messagesBackup: {
        count: messagesBackup.backedUp,
        file: messagesBackup.filePath ? path.basename(messagesBackup.filePath) : null
      },
      privatechatsBackup: {
        count: privatechatsBackup.backedUp,
        file: privatechatsBackup.filePath ? path.basename(privatechatsBackup.filePath) : null
      },
      deleted: {
        messages: messagesDeleted,
        privatechats: privatechatsDeleted,
        total: messagesDeleted + privatechatsDeleted
      },
      storageAfter: storageAfter.totalMB
    };
  } catch (error) {
    console.error('❌ Error in manual cleanup:', error);
    throw error;
  }
}

/**
 * Check if automatic cleanup should run
 */
export async function checkAndRunAutoCleanup() {
  try {
    const settings = await getSiteSettings();
    const cleanMinSizeKB = settings.cleanMinSize || 512000; // Default: 512000 KB = 500 MB
    const cleanMinSizeMB = cleanMinSizeKB / 1024; // Convert KB to MB for comparison
    
    // Get current storage size
    const storage = await getStorageSize();
    
    console.log(`📊 Current storage: ${storage.totalMB.toFixed(2)} MB, Threshold: ${cleanMinSizeMB.toFixed(2)} MB (${cleanMinSizeKB} KB)`);
    
    // Check if storage exceeds threshold
    if (storage.totalMB >= cleanMinSizeMB) {
      console.log('⚠️ Storage threshold exceeded, running automatic cleanup...');
      const result = await manualCleanup();
      return {
        cleanupPerformed: true,
        triggered: true,
        reason: 'storage_threshold_exceeded',
        ...result
      };
    } else {
      console.log('✅ Storage is below threshold, no cleanup needed');
      return {
        cleanupPerformed: false,
        triggered: false,
        currentSize: storage.totalMB,
        threshold: cleanMinSizeMB
      };
    }
  } catch (error) {
    console.error('❌ Error checking auto cleanup:', error);
    throw error;
  }
}
