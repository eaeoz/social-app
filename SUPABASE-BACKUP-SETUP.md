# Supabase Backup Setup Guide

This guide explains how to set up Supabase backup functionality for your social app.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Create Supabase Tables

In your Supabase project, create two tables:

### Messages Table
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  content TEXT,
  sender_id TEXT,
  sender_username TEXT,
  room_id TEXT,
  receiver_id TEXT,
  message_type TEXT DEFAULT 'text',
  is_private BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
```

### Private Chats Table
```sql
CREATE TABLE privatechats (
  id TEXT PRIMARY KEY,
  participants JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  unread_count JSONB DEFAULT '{}',
  last_message_id TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_privatechats_created_at ON privatechats(created_at DESC);
CREATE INDEX idx_privatechats_participants ON privatechats USING GIN(participants);
CREATE INDEX idx_privatechats_last_message_at ON privatechats(last_message_at DESC);
```

## Step 2: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the sidebar
3. Click on **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (this is your API key)

## Step 3: Add Environment Variables

Add the following to your `server/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

**Replace:**
- `https://your-project.supabase.co` with your actual Supabase project URL
- `your-anon-key-here` with your actual anon/public key

## Step 4: Restart Server

After adding the environment variables, restart your server:

```bash
cd server
npm run dev
```

## Step 5: Test the Backup

1. Go to your admin panel
2. Navigate to the **Cleanup** section
3. First, run "Manual Backup & Cleanup" to create backup files
4. Then click "☁️ Backup to Supabase"
5. Check your Supabase dashboard to verify the data was uploaded

## How It Works

1. **Manual Backup & Cleanup**: Creates JSON backup files in `server/backups/` directory
2. **Backup to Supabase**: Uploads the latest backup files to Supabase tables
3. **Upsert Logic**: Uses `_id` field to avoid duplicates (updates if exists, inserts if new)

## Features

- ✅ Automatic duplicate detection (upsert based on `_id`)
- ✅ Batch processing for large datasets
- ✅ Detailed success/error reporting
- ✅ Only uploads latest backup files
- ✅ Safe operation (doesn't modify local backups)

## Troubleshooting

### Error: "Failed to backup to Supabase"

1. **Check environment variables**:
   ```bash
   # In server directory
   cat .env | grep SUPABASE
   ```
   Make sure both `SUPABASE_URL` and `SUPABASE_KEY` are set.

2. **Verify Supabase credentials**:
   - Go to Supabase dashboard → Settings → API
   - Confirm the URL and key match your `.env` file

3. **Check table structure**:
   - Make sure tables exist with correct names (`messages` and `privatechats`)
   - Verify column types match the data structure

4. **Check server logs**:
   - Look for detailed error messages in the server console
   - Common issues:
     - Invalid credentials
     - Table doesn't exist
     - Permission issues

### No backup files available

The "Backup to Supabase" button only appears when backup files exist. First run "Manual Backup & Cleanup" to create backup files.

## Security Notes

- Never commit `.env` file to version control
- The anon/public key is safe to use in frontend, but keep it in `.env` for consistency
- Consider using Row Level Security (RLS) in Supabase for additional protection
- Regularly rotate your API keys

## Storage Limits

Supabase free tier includes:
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth

Monitor your usage in the Supabase dashboard and upgrade if needed.

## Backup Schedule

The system creates backups based on your configured cleanup schedule:
- Backups are stored locally in `server/backups/` directory
- Upload to Supabase manually when needed
- Consider setting up automated cloud backups for critical data

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
