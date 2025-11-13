import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Delete all organized backup folders
 * This will remove folders starting with "organized_" but keep original backup JSON files
 */
async function cleanOrganizedBackups() {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    
    console.log('🧹 Starting cleanup of organized backup folders...');
    console.log(`📁 Backup directory: ${backupsDir}\n`);
    
    // Read all items in backups directory
    const items = await fs.readdir(backupsDir, { withFileTypes: true });
    
    // Filter for organized backup folders
    const organizedFolders = items.filter(item => 
      item.isDirectory() && item.name.startsWith('organized_')
    );
    
    if (organizedFolders.length === 0) {
      console.log('ℹ️ No organized backup folders found to clean');
      return {
        success: true,
        deleted: 0,
        folders: []
      };
    }
    
    console.log(`Found ${organizedFolders.length} organized backup folder(s) to delete:\n`);
    
    const deletedFolders = [];
    let totalDeleted = 0;
    
    // Delete each organized folder
    for (const folder of organizedFolders) {
      const folderPath = path.join(backupsDir, folder.name);
      
      try {
        // Get folder size info before deleting
        const stats = await getFolderStats(folderPath);
        
        console.log(`🗑️ Deleting: ${folder.name}`);
        console.log(`   Files: ${stats.fileCount}, Size: ${stats.totalSize.toFixed(2)} MB`);
        
        // Remove the folder and all its contents
        await fs.rm(folderPath, { recursive: true, force: true });
        
        deletedFolders.push({
          name: folder.name,
          fileCount: stats.fileCount,
          sizeMB: stats.totalSize
        });
        
        totalDeleted++;
        console.log(`   ✅ Deleted successfully\n`);
      } catch (error) {
        console.error(`   ❌ Error deleting ${folder.name}:`, error.message);
      }
    }
    
    console.log('=== Cleanup Complete ===');
    console.log(`✅ Successfully deleted ${totalDeleted} organized backup folder(s)`);
    console.log(`📋 Original backup JSON files have been preserved`);
    
    return {
      success: true,
      deleted: totalDeleted,
      folders: deletedFolders
    };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get statistics about a folder (file count and total size)
 */
async function getFolderStats(folderPath) {
  let fileCount = 0;
  let totalSize = 0;
  
  async function scanDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        await scanDirectory(itemPath);
      } else {
        fileCount++;
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
      }
    }
  }
  
  await scanDirectory(folderPath);
  
  return {
    fileCount,
    totalSize: totalSize / (1024 * 1024) // Convert to MB
  };
}

/**
 * List all organized backup folders without deleting
 */
async function listOrganizedBackups() {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    const items = await fs.readdir(backupsDir, { withFileTypes: true });
    
    const organizedFolders = items.filter(item => 
      item.isDirectory() && item.name.startsWith('organized_')
    );
    
    if (organizedFolders.length === 0) {
      console.log('ℹ️ No organized backup folders found');
      return [];
    }
    
    console.log(`\nFound ${organizedFolders.length} organized backup folder(s):\n`);
    
    const folderInfo = [];
    
    for (const folder of organizedFolders) {
      const folderPath = path.join(backupsDir, folder.name);
      const stats = await getFolderStats(folderPath);
      
      folderInfo.push({
        name: folder.name,
        fileCount: stats.fileCount,
        sizeMB: stats.totalSize
      });
      
      console.log(`📁 ${folder.name}`);
      console.log(`   Files: ${stats.fileCount}`);
      console.log(`   Size: ${stats.totalSize.toFixed(2)} MB\n`);
    }
    
    return folderInfo;
  } catch (error) {
    console.error('❌ Error listing organized backups:', error);
    throw error;
  }
}

// Run the script based on command line argument
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listOrganizedBackups()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('✗ Script failed:', error);
      process.exit(1);
    });
} else if (command === 'clean' || !command) {
  cleanOrganizedBackups()
    .then(() => {
      console.log('\n✓ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Script failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node cleanOrganizedBackups.js          - Clean all organized backup folders');
  console.log('  node cleanOrganizedBackups.js clean    - Clean all organized backup folders');
  console.log('  node cleanOrganizedBackups.js list     - List organized backup folders without deleting');
  process.exit(0);
}

export { cleanOrganizedBackups, listOrganizedBackups };
