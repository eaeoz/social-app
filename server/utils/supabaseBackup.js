import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Backup messages and privatechats to Supabase
 */
export async function backupToSupabase() {
  try {
    // Get credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    // Validate credentials
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file.');
    }
    
    // Check if credentials are still placeholders
    if (supabaseUrl.includes('your-project.supabase.co') || supabaseKey.startsWith('your-')) {
      throw new Error('Please replace placeholder Supabase credentials with actual values from your Supabase project. See SUPABASE-BACKUP-SETUP.md for instructions.');
    }
    
    console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const backupsDir = path.join(__dirname, '../backups');
    
    // Check if backups directory exists
    try {
      await fs.access(backupsDir);
    } catch (error) {
      throw new Error('Backups directory not found. Please run "Manual Backup & Cleanup" first.');
    }
    
    const files = await fs.readdir(backupsDir);
    
    // Find the latest backup files
    const messageFiles = files.filter(f => f.startsWith('messages_') && f.endsWith('.json')).sort().reverse();
    const privateChatFiles = files.filter(f => f.startsWith('privatechats_') && f.endsWith('.json')).sort().reverse();
    
    if (messageFiles.length === 0 && privateChatFiles.length === 0) {
      throw new Error('No backup files found. Please run "Manual Backup & Cleanup" first.');
    }
    
    const results = {
      messages: { inserted: 0, errors: [] },
      privatechats: { inserted: 0, errors: [] }
    };
    
    const filesUsed = {
      messages: null,
      privatechats: null
    };
    
    // Backup messages if file exists
    if (messageFiles.length > 0) {
      const messagesPath = path.join(backupsDir, messageFiles[0]);
      const messagesData = JSON.parse(await fs.readFile(messagesPath, 'utf8'));
      filesUsed.messages = messageFiles[0];
      
      console.log(`📤 Uploading ${messagesData.length} messages from ${messageFiles[0]}...`);
      
      // Transform MongoDB data to match Supabase schema
      const transformedMessages = messagesData.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender_id: msg.senderId,
        sender_username: msg.senderUsername || null,
        room_id: msg.roomId || null,
        receiver_id: msg.receiverId || null,
        message_type: msg.messageType || 'text',
        is_private: msg.isPrivate || false,
        is_read: msg.isRead || false,
        is_edited: msg.isEdited || false,
        created_at: msg.timestamp
      }));
      
      // Insert messages in batches (Supabase has limits)
      const batchSize = 100;
      for (let i = 0; i < transformedMessages.length; i += batchSize) {
        const batch = transformedMessages.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('messages')
          .upsert(batch, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Error inserting messages batch ${i}-${i + batchSize}:`, error);
          results.messages.errors.push(error.message);
        } else {
          results.messages.inserted += batch.length;
          console.log(`✅ Uploaded messages batch ${i}-${Math.min(i + batchSize, transformedMessages.length)}/${transformedMessages.length}`);
        }
      }
    }
    
    // Backup privatechats if file exists
    if (privateChatFiles.length > 0) {
      const privatechatsPath = path.join(backupsDir, privateChatFiles[0]);
      const privatechatsData = JSON.parse(await fs.readFile(privatechatsPath, 'utf8'));
      filesUsed.privatechats = privateChatFiles[0];
      
      console.log(`📤 Uploading ${privatechatsData.length} private chats from ${privateChatFiles[0]}...`);
      
      // Transform MongoDB data to match Supabase schema
      const transformedChats = privatechatsData.map(chat => ({
        id: chat._id,
        participants: chat.participants,
        is_active: chat.isActive !== undefined ? chat.isActive : true,
        unread_count: chat.unreadCount || {},
        last_message_id: chat.lastMessageId || null,
        last_message_at: chat.lastMessageAt || null,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt || chat.createdAt // Use createdAt if updatedAt is missing
      }));
      
      console.log(`🔍 Sample transformed chat:`, JSON.stringify(transformedChats[0], null, 2));
      
      const batchSize = 100;
      for (let i = 0; i < transformedChats.length; i += batchSize) {
        const batch = transformedChats.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('privatechats')
          .upsert(batch, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Error inserting privatechats batch ${i}-${i + batchSize}:`, error);
          results.privatechats.errors.push(error.message);
        } else {
          results.privatechats.inserted += batch.length;
          console.log(`✅ Uploaded privatechats batch ${i}-${Math.min(i + batchSize, transformedChats.length)}/${transformedChats.length}`);
        }
      }
    }
    
    console.log('✅ Supabase backup completed!');
    console.log(`📊 Messages: ${results.messages.inserted} uploaded, ${results.messages.errors.length} errors`);
    console.log(`📊 Private chats: ${results.privatechats.inserted} uploaded, ${results.privatechats.errors.length} errors`);
    
    return {
      success: true,
      results,
      filesUsed
    };
    
  } catch (error) {
    console.error('❌ Supabase backup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
