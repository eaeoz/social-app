import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reorganizes backup files into a structured folder format
 * - Private messages: organized by user ID pairs
 * - Public messages: organized by room IDs
 * (No MongoDB connection required - uses IDs directly)
 */
async function reorganizeBackups() {
  try {
    // Find all backup files in the backups directory
    const backupsDir = path.join(__dirname, '../backups');
    const files = await fs.readdir(backupsDir);
    
    // Filter for message backup files
    const messageBackupFiles = files.filter(f => 
      f.startsWith('messages_') && f.endsWith('.json')
    );
    
    console.log(`Found ${messageBackupFiles.length} message backup files to process\n`);
    
    // Process each backup file
    for (const filename of messageBackupFiles) {
      console.log(`--- Processing ${filename} ---`);
      const filePath = path.join(backupsDir, filename);
      
      // Read the backup file
      const content = await fs.readFile(filePath, 'utf8');
      const messages = JSON.parse(content);
      console.log(`Loaded ${messages.length} messages`);
      
      // Extract timestamp from filename for folder naming
      const timestamp = filename.replace('messages_', '').replace('.json', '');
      const baseDir = path.join(backupsDir, `organized_${timestamp}`);
      
      // Create base directory
      await fs.mkdir(baseDir, { recursive: true });
      
      // Separate messages into private and public
      const privateMessages = messages.filter(m => m.isPrivate === true);
      const publicMessages = messages.filter(m => m.isPrivate === false);
      
      console.log(`Private messages: ${privateMessages.length}`);
      console.log(`Public messages: ${publicMessages.length}`);
      
      // Process private messages
      if (privateMessages.length > 0) {
        const privateDir = path.join(baseDir, 'private_chats');
        await fs.mkdir(privateDir, { recursive: true });
        
        // Group private messages by conversation (sender-receiver pair)
        const conversations = new Map();
        
        privateMessages.forEach(msg => {
          const senderId = msg.senderId;
          const receiverId = msg.receiverId;
          
          // Create a consistent key for the conversation (sorted IDs)
          const ids = [senderId, receiverId].sort();
          const conversationKey = ids.join('_');
          
          if (!conversations.has(conversationKey)) {
            conversations.set(conversationKey, {
              participants: ids,
              messages: []
            });
          }
          
          conversations.get(conversationKey).messages.push(msg);
        });
        
        console.log(`Organized into ${conversations.size} private conversations`);
        
        // Save each conversation to its own file
        for (const [key, data] of conversations.entries()) {
          const [userId1, userId2] = data.participants;
          
          // Create folder name using user IDs
          const folderName = `user_${sanitizeFilename(userId1)}_and_user_${sanitizeFilename(userId2)}`;
          const conversationDir = path.join(privateDir, folderName);
          await fs.mkdir(conversationDir, { recursive: true });
          
          // Sort messages by timestamp
          data.messages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          // Save messages
          const messagesFile = path.join(conversationDir, 'messages.json');
          await fs.writeFile(
            messagesFile,
            JSON.stringify(data.messages, null, 2),
            'utf8'
          );
          
          // Create a readable info file
          const infoFile = path.join(conversationDir, 'info.txt');
          await fs.writeFile(
            infoFile,
            `Private Chat Between:\n` +
            `- User ID: ${userId1}\n` +
            `- User ID: ${userId2}\n\n` +
            `Total Messages: ${data.messages.length}\n` +
            `First Message: ${data.messages[0].timestamp}\n` +
            `Last Message: ${data.messages[data.messages.length - 1].timestamp}\n`,
            'utf8'
          );
          
          console.log(`  ✓ Saved conversation: ${folderName} (${data.messages.length} messages)`);
        }
      }
      
      // Process public messages
      if (publicMessages.length > 0) {
        const publicDir = path.join(baseDir, 'public_rooms');
        await fs.mkdir(publicDir, { recursive: true });
        
        // Group public messages by room
        const roomMessages = new Map();
        
        publicMessages.forEach(msg => {
          const roomId = msg.roomId;
          
          if (!roomMessages.has(roomId)) {
            roomMessages.set(roomId, []);
          }
          
          roomMessages.get(roomId).push(msg);
        });
        
        console.log(`Organized into ${roomMessages.size} public rooms`);
        
        // Save each room's messages to its own file
        for (const [roomId, messages] of roomMessages.entries()) {
          // Create folder name using room ID
          const folderName = `room_${sanitizeFilename(roomId)}`;
          const roomDir = path.join(publicDir, folderName);
          await fs.mkdir(roomDir, { recursive: true });
          
          // Sort messages by timestamp
          messages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          // Save messages
          const messagesFile = path.join(roomDir, 'messages.json');
          await fs.writeFile(
            messagesFile,
            JSON.stringify(messages, null, 2),
            'utf8'
          );
          
          // Create a readable info file
          const infoFile = path.join(roomDir, 'info.txt');
          await fs.writeFile(
            infoFile,
            `Public Room\n` +
            `Room ID: ${roomId}\n\n` +
            `Total Messages: ${messages.length}\n` +
            `First Message: ${messages[0].timestamp}\n` +
            `Last Message: ${messages[messages.length - 1].timestamp}\n`,
            'utf8'
          );
          
          console.log(`  ✓ Saved room: ${folderName} (${messages.length} messages)`);
        }
      }
      
      console.log(`\n✓ Completed processing ${filename}`);
      console.log(`  Organized backups saved to: ${baseDir}\n`);
    }
    
    console.log('=== Backup Reorganization Complete ===');
    console.log(`All organized backups are in: ${backupsDir}`);
    console.log('Each backup date has its own folder with private_chats and public_rooms subdirectories.');
    
  } catch (error) {
    console.error('Error reorganizing backups:', error);
    throw error;
  }
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 200); // Limit length
}

// Run the script
reorganizeBackups()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });

export { reorganizeBackups };
