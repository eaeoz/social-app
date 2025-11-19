# Google reCAPTCHA v3 Setup Guide

## Overview

The blog contact form is now protected with Google reCAPTCHA v3, which provides invisible bot protection without requiring user interaction.

## ✅ What's Already Implemented

### Frontend
- ✅ `react-google-recaptcha-v3` package installed
- ✅ `GoogleReCaptchaProvider` added to main.tsx
- ✅ Contact form uses reCAPTCHA hook
- ✅ Automatic token generation on form submission

### Backend
- ✅ Netlify function verifies reCAPTCHA tokens
- ✅ Score-based validation (rejects scores < 0.5)
- ✅ Error handling for failed verifications

## 🔧 Setup Instructions

### Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+"** to create a new site
3. Fill in the form:
   - **Label**: `Sedat's Blog` (or your site name)
   - **reCAPTCHA type**: Select **"reCAPTCHA v3"**
   - **Domains**: Add:
     - `localhost` (for testing)
     - `sedat.netlify.app` (your production domain)
   - Accept the terms
4. Click **"Submit"**
5. You'll receive two keys:
   - **Site Key** (public, used in frontend)
   - **Secret Key** (private, used in backend)

### Step 2: Update Environment Variables

#### Local Development (.env file)

Update your `blog/.env` file:

```env
# Google reCAPTCHA v3
VITE_RECAPTCHA_SITE_KEY=your_actual_site_key_here
RECAPTCHA_SECRET_KEY=your_actual_secret_key_here
```

**Example:**
```env
VITE_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

#### Netlify Deployment

1. Go to your Netlify dashboard
2. Select your site (sedat.netlify.app)
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:

   **Variable 1:**
   - Key: `VITE_RECAPTCHA_SITE_KEY`
   - Value: Your reCAPTCHA Site Key
   - Scopes: ✅ All scopes

   **Variable 2:**
   - Key: `RECAPTCHA_SECRET_KEY`
   - Value: Your reCAPTCHA Secret Key
   - Scopes: ✅ All scopes (needed for Netlify Functions)

5. Click **"Save"**
6. Redeploy your site for changes to take effect

## 🎯 How It Works

### Frontend Flow

1. User opens contact form
2. reCAPTCHA v3 loads invisibly in background
3. User fills out form and clicks "Send Message"
4. System automatically generates reCAPTCHA token
5. Token is sent with form data to backend

### Backend Verification

1. Netlify function receives form data + reCAPTCHA token
2. Function sends token to Google for verification
3. Google returns verification result with score (0.0 - 1.0)
   - **1.0** = Very likely human
   - **0.0** = Very likely bot
4. Function checks:
   - ✅ Verification successful
   - ✅ Score ≥ 0.5 (configurable)
5. If passed: Send email
6. If failed: Return error to user

### Score Threshold

Current threshold: **0.5**

You can adjust this in `blog/netlify/functions/contact.ts`:

```typescript
// Change 0.5 to your preferred threshold (0.0 - 1.0)
if (!recaptchaData.success || (recaptchaData.score && recaptchaData.score < 0.5)) {
  // Reject submission
}
```

**Recommended thresholds:**
- **0.3** - More lenient (allows more submissions, may allow some bots)
- **0.5** - Balanced (default, good for most sites)
- **0.7** - Strict (blocks more bots, may block some humans)

## 🧪 Testing

### Local Testing

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open contact form at `http://localhost:3002/contact`

3. Fill out and submit form

4. Check browser console for reCAPTCHA messages

5. Check terminal for verification results

### Production Testing

1. Deploy to Netlify
2. Visit `https://sedat.netlify.app/contact`
3. Submit contact form
4. Verify email is received
5. Check Netlify function logs for reCAPTCHA verification

## 🔍 Debugging

### Common Issues

#### 1. "reCAPTCHA not loaded" Error

**Cause:** Site key not set or incorrect

**Solution:**
```env
# Make sure this is set in .env
VITE_RECAPTCHA_SITE_KEY=your_actual_site_key
```

#### 2. "reCAPTCHA verification failed" Error

**Causes:**
- Secret key not set in Netlify
- Incorrect secret key
- Domain not whitelisted in reCAPTCHA console

**Solutions:**
1. Check Netlify environment variables
2. Verify keys are correct
3. Add your domain in reCAPTCHA admin console

#### 3. Form Submits But reCAPTCHA Doesn't Verify

**Cause:** Function doesn't have access to secret key

**Solution:**
1. Go to Netlify → Environment Variables
2. Make sure `RECAPTCHA_SECRET_KEY` is set with "All scopes"
3. Redeploy site

### Enable Debug Mode

Add to your reCAPTCHA admin console:
1. Go to your site settings
2. Check **"Use reCAPTCHA v3 on this domain"**
3. Enable **"Send me alerts"** for debugging

### View Verification Logs

In your Netlify function logs, you'll see:
```
reCAPTCHA verification: success
Score: 0.9
```

## 🎨 User Experience

### What Users See

**Before:**
- User fills form
- Clicks submit
- Email sent

**After (with reCAPTCHA):**
- User fills form
- Clicks submit
- reCAPTCHA badge appears bottom-right (optional)
- Email sent (if human)
- Error message (if bot)

### reCAPTCHA Badge

The reCAPTCHA v3 badge appears in the bottom-right corner. This is:
- ✅ Required by Google's terms
- ✅ Automatically added
- ✅ Can be hidden with CSS (if you add disclaimer)

To hide badge (add to Terms/Privacy page first):
```css
.grecaptcha-badge {
  visibility: hidden;
}
```

## 📊 Monitoring

### View reCAPTCHA Analytics

1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your site
3. View metrics:
   - Requests per day
   - Score distribution
   - Challenge rate
   - Pass rate

### Best Practices

✅ **Monitor scores regularly**
✅ **Adjust threshold based on data**
✅ **Check for false positives**
✅ **Review blocked submissions**

## 🔒 Security

### Why reCAPTCHA v3?

**Advantages:**
- ✅ Invisible - no user interaction needed
- ✅ Score-based - more flexible than pass/fail
- ✅ Google's AI - constantly improving
- ✅ Easy integration - minimal code changes

**Protects Against:**
- 🛡️ Spam bots
- 🛡️ Automated form submissions
- 🛡️ Credential stuffing
- 🛡️ Scraping attacks

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Get reCAPTCHA v3 keys from Google
- [ ] Add site key to `.env` file (`VITE_RECAPTCHA_SITE_KEY`)
- [ ] Add secret key to `.env` file (`RECAPTCHA_SECRET_KEY`)
- [ ] Add both keys to Netlify environment variables
- [ ] Add production domain to reCAPTCHA allowed domains
- [ ] Test contact form locally
- [ ] Deploy to Netlify
- [ ] Test contact form on production
- [ ] Verify email is received
- [ ] Check Netlify function logs
- [ ] Monitor reCAPTCHA dashboard

## 📚 Additional Resources

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Score Interpretation Guide](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)
- [React reCAPTCHA v3 Package](https://www.npmjs.com/package/react-google-recaptcha-v3)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

## 💡 Tips

1. **Start with default threshold (0.5)** and adjust based on your needs
2. **Monitor false positives** - some VPN users may get lower scores
3. **Add clear error messages** so users know if they're blocked
4. **Test with different networks** to see score variations
5. **Keep keys secret** - never commit to git!

## ✅ Summary

Your blog now has:
- ✅ Invisible bot protection
- ✅ No user captchas or puzzles
- ✅ Score-based verification
- ✅ Production-ready security
- ✅ Google reCAPTCHA v3 integration

Just add your keys and deploy! 🚀
