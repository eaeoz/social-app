import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export async function getSupabaseStats() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return {
        success: false,
        error: 'Supabase credentials not configured'
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Fetching Supabase statistics...');

    // Get messages count
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (messagesError) {
      console.error('❌ Error counting messages:', messagesError);
      throw messagesError;
    }

    // Get privatechats count
    const { count: chatsCount, error: chatsError } = await supabase
      .from('privatechats')
      .select('*', { count: 'exact', head: true });

    if (chatsError) {
      console.error('❌ Error counting privatechats:', chatsError);
      throw chatsError;
    }

    // Get sample data to calculate approximate size
    const { data: messagesSample, error: sampleError } = await supabase
      .from('messages')
      .select('*')
      .limit(100);

    if (sampleError) {
      console.error('❌ Error fetching messages sample:', sampleError);
    }

    const { data: chatsSample, error: chatsSampleError } = await supabase
      .from('privatechats')
      .select('*')
      .limit(100);

    if (chatsSampleError) {
      console.error('❌ Error fetching chats sample:', chatsSampleError);
    }

    // Calculate approximate sizes (rough estimate based on JSON stringified size)
    const avgMessageSize = messagesSample && messagesSample.length > 0 
      ? JSON.stringify(messagesSample).length / messagesSample.length 
      : 0;
    
    const avgChatSize = chatsSample && chatsSample.length > 0
      ? JSON.stringify(chatsSample).length / chatsSample.length
      : 0;

    const estimatedMessagesSize = (messagesCount || 0) * avgMessageSize;
    const estimatedChatsSize = (chatsCount || 0) * avgChatSize;
    const totalSize = estimatedMessagesSize + estimatedChatsSize;

    console.log('✅ Supabase stats fetched successfully');
    console.log(`📊 Messages: ${messagesCount || 0} rows (~${(estimatedMessagesSize / 1024).toFixed(2)} KB)`);
    console.log(`📊 Private Chats: ${chatsCount || 0} rows (~${(estimatedChatsSize / 1024).toFixed(2)} KB)`);
    console.log(`📊 Total: ~${(totalSize / 1024).toFixed(2)} KB`);

    return {
      success: true,
      stats: {
        messagesCount: messagesCount || 0,
        privatechatsCount: chatsCount || 0,
        estimatedMessagesSize: estimatedMessagesSize,
        estimatedChatsSize: estimatedChatsSize,
        totalSize: totalSize,
        messagesKB: (estimatedMessagesSize / 1024).toFixed(2),
        chatsKB: (estimatedChatsSize / 1024).toFixed(2),
        totalKB: (totalSize / 1024).toFixed(2),
        totalMB: (totalSize / 1024 / 1024).toFixed(2)
      }
    };
  } catch (error) {
    console.error('❌ Supabase stats failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to get Supabase statistics'
    };
  }
}
