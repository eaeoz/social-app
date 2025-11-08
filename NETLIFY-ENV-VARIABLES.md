# Netlify Environment Variables Setup

## Required Environment Variables

Set these in your Netlify Dashboard for the contact form function to work:

### 1. Go to Netlify Dashboard
- Navigate to your site
- Go to **Site settings** → **Environment variables**

### 2. Add These Variables

Click **"Add a variable"** for each of these:

#### SMTP_USER
- **Key:** `SMTP_USER`
- **Value:** Your email address (e.g., `sedatergoz@yandex.com`)
- **Scopes:** Check all deployment contexts (Production, Deploy Previews, Branch deploys)

#### SMTP_PASS
- **Key:** `SMTP_PASS`
- **Value:** Your SMTP password or app-specific password (e.g., `ihinuaqtejpjnjhm`)
- **Scopes:** Check all deployment contexts

#### SMTP_HOST (Optional)
- **Key:** `SMTP_HOST`
- **Value:** Your SMTP server (e.g., `smtp.yandex.com`)
- **Scopes:** Check all deployment contexts
- **Note:** Defaults to `smtp.yandex.com` if not set

#### SMTP_PORT (Optional)
- **Key:** `SMTP_PORT`
- **Value:** SMTP port number (e.g., `587`)
- **Scopes:** Check all deployment contexts
- **Note:** Defaults to `587` if not set

#### RECIPIENT_EMAIL
- **Key:** `RECIPIENT_EMAIL`
- **Value:** Email address to receive contact form submissions (e.g., `sedatergoz@gmail.com`)
- **Scopes:** Check all deployment contexts

## Your Configuration

Based on your MongoDB settings, here are your values:

```
SMTP_USER = sedatergoz@yandex.com
SMTP_PASS = ihinuaqtejpjnjhm
SMTP_HOST = smtp.yandex.com
SMTP_PORT = 587
RECIPIENT_EMAIL = sedatergoz@gmail.com
```

## Step-by-Step Setup

### 1. Navigate to Environment Variables
```
Netlify Dashboard → Your Site → Site settings → Environment variables
```

### 2. Add Each Variable
For each variable above:
1. Click **"Add a variable"**
2. Select **"Add a single variable"**
3. Enter the **Key** (e.g., SMTP_USER)
4. Enter the **Value** (your actual value)
5. Select scopes: **Production**, **Deploy Previews**, **Branch deploys**
6. Click **"Create variable"**

### 3. Verify Variables
After adding all variables, you should see:
- SMTP_USER
- SMTP_PASS
- SMTP_HOST
- SMTP_PORT
- RECIPIENT_EMAIL

## After Setting Variables

1. **Redeploy your site:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or push new commit to trigger auto-deploy

2. **Test the function:**
   - Visit your live site
   - Submit the contact form
   - Check Netlify function logs for debug information

## Common SMTP Providers

### Yandex Mail (your current setup)
```
SMTP_HOST = smtp.yandex.com
SMTP_PORT = 587
```

### Gmail
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
```
Note: Gmail requires app-specific password, not your regular password

### Outlook/Hotmail
```
SMTP_HOST = smtp-mail.outlook.com
SMTP_PORT = 587
```

### Custom Domain Email
Check with your email provider for SMTP settings

## Security Notes

✅ **Environment variables are secure:**
- Not visible in your code
- Not exposed to frontend
- Only accessible by Netlify functions
- Encrypted at rest

✅ **Best practices:**
- Never commit credentials to Git
- Use app-specific passwords when available
- Rotate passwords periodically
- Monitor function logs for unusual activity

## Troubleshooting

### "Email service is not configured"
- Check all required variables are set
- Verify variable names match exactly (case-sensitive)
- Redeploy after adding variables

### "Email authentication failed"
- Double-check SMTP_USER and SMTP_PASS
- Ensure you're using correct password (not account password, but app password if required)
- Verify SMTP_HOST is correct

### "Unable to connect to email server"
- Check SMTP_HOST and SMTP_PORT are correct
- Try port 465 with SSL (change SMTP_PORT to 465)
- Check your email provider's SMTP settings

## Viewing Function Logs

To see detailed debug logs:
1. Go to **Functions** tab in Netlify Dashboard
2. Click on **contact** function
3. View recent invocations
4. Each invocation shows:
   - Request details
   - Configuration status
   - Email sending process
   - Success/error messages

## Local Development

For local testing with Netlify CLI:
1. Create `.env` file in `client` directory:
   ```
   SMTP_USER=sedatergoz@yandex.com
   SMTP_PASS=ihinuaqtejpjnjhm
   SMTP_HOST=smtp.yandex.com
   SMTP_PORT=587
   RECIPIENT_EMAIL=sedatergoz@gmail.com
   ```

2. Run Netlify Dev:
   ```bash
   cd client
   netlify dev
   ```

3. Test at: `http://localhost:8888`

**Important:** Don't commit `.env` file to Git!
