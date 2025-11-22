# Blog Deployment Guide

Complete guide for deploying your blog to Netlify.

## Prerequisites

1. ✅ Blog project created and working locally
2. ✅ GitHub account
3. ✅ Netlify account
4. ✅ Appwrite account with database and collections set up
5. ✅ SMTP credentials (Gmail, SendGrid, etc.)

## Step 1: Prepare Environment Variables

Before deploying, gather all these credentials:

### Appwrite Configuration
- Go to your Appwrite Console
- Copy your Project ID
- Copy your Database ID
- Copy your Articles Collection ID

### SMTP Configuration
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use that as SMTP_PASS

### Social Media Links
Prepare your social media profile URLs

## Step 2: Push to GitHub

```bash
cd blog
git init
git add .
git commit -m "Initial blog setup"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Deploy to Netlify

### Option A: Via Netlify Dashboard

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Base directory**: `blog`
   - **Build command**: `npm run build`
   - **Publish directory**: `blog/dist`
   - **Functions directory**: `blog/netlify/functions`

5. Click "Deploy site"

### Option B: Via Netlify CLI

```bash
npm install -g netlify-cli
cd blog
netlify init
netlify deploy --prod
```

## Step 4: Configure Environment Variables in Netlify

1. Go to your site in Netlify Dashboard
2. Click "Site settings" → "Environment variables"
3. Add all variables (click "Add a variable" for each):

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_ARTICLES_COLLECTION_ID=your_articles_collection_id

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_TO_EMAIL=recipient@example.com

VITE_SITE_URL=https://sedat.netlify.app
VITE_SITE_NAME=Sedat's Blog
VITE_SITE_DESCRIPTION=Modern tech blog with articles about software development

VITE_SOCIAL_GITHUB=https://github.com/yourusername
VITE_SOCIAL_LINKEDIN=https://linkedin.com/in/yourusername
VITE_SOCIAL_TWITTER=https://twitter.com/yourusername
VITE_SOCIAL_INSTAGRAM=https://instagram.com/yourusername

VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxx
```

4. Click "Save" after adding all variables

## Step 5: Configure Custom Domain (Optional)

If you want to use sedat.netlify.app:

1. Go to "Domain settings"
2. Click "Options" → "Edit site name"
3. Change to "sedat"
4. Your site will be available at https://sedat.netlify.app

For custom domain:
1. Click "Add custom domain"
2. Enter your domain name
3. Follow DNS configuration instructions

## Step 6: Update Robots.txt and Sitemap

After deployment with your actual domain:

1. Update `blog/public/robots.txt`:
```txt
User-agent: *
Allow: /

Sitemap: https://sedat.netlify.app/sitemap.xml
```

2. Update `blog/scripts/generate-sitemap.js` with your actual URL

3. Regenerate sitemap:
```bash
cd blog
npm run generate-sitemap
git add .
git commit -m "Update sitemap with production URL"
git push
```

## Step 7: Test Your Deployment

1. ✅ Homepage loads correctly
2. ✅ Articles display from Appwrite
3. ✅ Search functionality works
4. ✅ Navigation works (About, Contact, Privacy, Terms)
5. ✅ Contact form sends emails
6. ✅ Mobile responsive design works
7. ✅ Dark theme applied correctly
8. ✅ Social media links work
9. ✅ SEO meta tags present

## Step 8: Set Up Google AdSense (Optional)

1. Apply for Google AdSense
2. Add your site
3. Place ad code in appropriate locations
4. Wait for approval
5. Add your AdSense Client ID to environment variables
6. Redeploy

## Step 9: Monitor and Optimize

### Analytics
- Set up Google Analytics
- Add tracking code to index.html
- Monitor traffic and user behavior

### Performance
- Check Lighthouse scores
- Optimize images
- Enable Netlify's image optimization
- Use CDN for assets

### SEO
- Submit sitemap to Google Search Console
- Submit to Bing Webmaster Tools
- Monitor search rankings
- Create quality content regularly

## Troubleshooting

### Build Fails
- Check build logs in Netlify
- Verify all environment variables are set
- Test build locally: `npm run build`

### Contact Form Not Working
- Verify SMTP credentials
- Check Netlify Functions logs
- Test with a different email provider

### Articles Not Loading
- Verify Appwrite credentials
- Check Appwrite console for errors
- Ensure collection permissions are set correctly
- Check browser console for errors

### 404 Errors
- Verify `_redirects` file in public folder
- Check Netlify.toml configuration
- Ensure SPA routing is configured

## Continuous Deployment

Once set up, any push to your main branch will trigger automatic deployment:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Netlify automatically builds and deploys
```

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use environment variables for all secrets
3. ✅ Keep dependencies updated: `npm audit fix`
4. ✅ Enable HTTPS (automatic with Netlify)
5. ✅ Set proper CORS headers
6. ✅ Implement rate limiting for contact form
7. ✅ Regularly backup Appwrite data

## Cost Considerations

### Free Tier Includes:
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Appwrite**: Free cloud tier available
- **Gmail SMTP**: Free for personal use

### Paid Services (Optional):
- Custom domain: ~$10-15/year
- Premium SMTP: $10-50/month
- Google AdSense: Revenue generating

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review Appwrite console logs
3. Check browser console for errors
4. Review this guide's troubleshooting section
5. Contact support through the blog's contact form

## Next Steps

1. ✅ Create your first blog article in Appwrite
2. ✅ Customize About page content
3. ✅ Add your actual social media links
4. ✅ Set up Google Analytics
5. ✅ Apply for Google AdSense
6. ✅ Share your blog on social media
7. ✅ Start creating quality content!

---

**Congratulations! Your blog is now live at https://sedat.netlify.app** 🎉
