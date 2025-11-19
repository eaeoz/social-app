import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function cleanSupabaseTables() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Supabase credentials not configured'
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Starting Supabase tables cleanup...');

    // Delete all messages
    const { error: messagesError, count: messagesCount } = await supabase
      .from('messages')
      .delete()
      .neq('_id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

    if (messagesError) {
      console.error('❌ Error deleting messages:', messagesError);
      throw messagesError;
    }

    // Delete all privatechats
    const { error: chatsError, count: chatsCount } = await supabase
      .from('privatechats')
      .delete()
      .neq('_id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

    if (chatsError) {
      console.error('❌ Error deleting privatechats:', chatsError);
      throw chatsError;
    }

    console.log('✅ Supabase cleanup completed successfully');
    console.log(`📊 Deleted: ${messagesCount || 'all'} messages, ${chatsCount || 'all'} chats`);

    return {
      success: true,
      deleted: {
        messages: messagesCount || 'all',
        privatechats: chatsCount || 'all'
      }
    };
  } catch (error) {
    console.error('❌ Supabase cleanup failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to clean Supabase tables'
    };
  }
}
