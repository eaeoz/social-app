import { createClient } from '@supabase/supabase-js';

/**
 * Export and merge data from Supabase (messages + privatechats)
 */
export async function exportFromSupabase() {
  try {
    // Get credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    // Validate credentials
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env file.');
    }
    
    console.log(`🔗 Connecting to Supabase for export: ${supabaseUrl}`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all messages
    console.log('📥 Fetching messages from Supabase...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }
    
    // Fetch all privatechats
    console.log('📥 Fetching private chats from Supabase...');
    const { data: privatechats, error: privatechatsError } = await supabase
      .from('privatechats')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (privatechatsError) {
      throw new Error(`Failed to fetch private chats: ${privatechatsError.message}`);
    }
    
    // Calculate statistics
    const stats = {
      totalMessages: messages?.length || 0,
      privateMessages: messages?.filter(m => m.is_private === true).length || 0,
      publicMessages: messages?.filter(m => m.is_private === false).length || 0,
      totalChats: privatechats?.length || 0,
      activeChats: privatechats?.filter(c => c.is_active === true).length || 0
    };
    
    console.log('✅ Export completed successfully!');
    console.log(`📊 Stats: ${stats.totalMessages} messages, ${stats.totalChats} chats`);
    
    // Return merged data
    return {
      success: true,
      exportDate: new Date().toISOString(),
      messages: messages || [],
      privatechats: privatechats || [],
      stats
    };
    
  } catch (error) {
    console.error('❌ Supabase export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
