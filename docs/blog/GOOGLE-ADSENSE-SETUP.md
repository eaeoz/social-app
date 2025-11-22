# Google AdSense Setup Guide

This guide explains how Google AdSense has been integrated into the blog application.

## Overview

Google AdSense is dynamically loaded using the environment variable `VITE_ADSENSE_CLIENT_ID`. The implementation loads the AdSense script automatically when the application starts, following the same pattern as Google Analytics.

## Configuration

### Environment Variable

Your Google AdSense Client ID is already configured in the `.env` file:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-7766172957848399
```

### For Netlify Deployment

The environment variable should already be set, but if you need to update it:

1. Go to Site settings → Environment variables
2. Add/update the variable:
   - **Key:** `VITE_ADSENSE_CLIENT_ID`
   - **Value:** `ca-pub-7766172957848399`
3. Redeploy your site

## Implementation Details

### Files Modified/Created

1. **`blog/src/main.tsx`**
   - Added `initGoogleAdSense()` function that dynamically loads the AdSense script
   - Reads the Client ID from `import.meta.env.VITE_ADSENSE_CLIENT_ID`
   - Script includes `crossorigin="anonymous"` attribute as required by Google
   - Runs automatically when the application starts

2. **`blog/index.html`**
   - Added Google AdSense meta tag in the head section:
   ```html
   <meta name="google-adsense-account" content="ca-pub-7766172957848399">
   ```

3. **`blog/public/ads.txt`**
   - Created ads.txt file with your publisher information:
   ```
   google.com, pub-7766172957848399, DIRECT, f08c47fec0942fa0
   ```
   - This file is required by Google AdSense for verification
   - Accessible at: `https://sedat.netlify.app/ads.txt`

4. **`blog/public/robots.txt`**
   - Updated to explicitly allow access to ads.txt and sitemap.xml:
   ```
   Allow: /ads.txt
   Allow: /sitemap.xml
   ```

5. **`blog/netlify.toml`**
   - Updated Content-Security-Policy to allow AdSense domains:
     - `https://pagead2.googlesyndication.com`
     - `https://adservice.google.com`
     - `https://googleads.g.doubleclick.net`
   - Added specific headers for ads.txt and sitemap.xml files
   - Configured proper MIME types and cache headers

## How It Works

1. When the app loads, `initGoogleAdSense()` is called
2. The function checks if `VITE_ADSENSE_CLIENT_ID` is configured
3. If configured, it:
   - Creates a script tag pointing to AdSense with your client ID
   - Sets the async attribute for non-blocking loading
   - Sets crossorigin="anonymous" as required by Google
   - Appends the script to the document head

## AdSense Script Format

The implementation loads the following script:
```html
<script async 
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7766172957848399"
  crossorigin="anonymous"></script>
```

## Adding Ad Units

To add ad units to your blog pages, use the standard AdSense code in your React components:

```jsx
useEffect(() => {
  try {
    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
  } catch (err) {
    console.error('AdSense error:', err);
  }
}, []);

return (
  <ins className="adsbygoogle"
    style={{ display: 'block' }}
    data-ad-client="ca-pub-7766172957848399"
    data-ad-slot="1234567890"
    data-ad-format="auto"
    data-full-width-responsive="true">
  </ins>
);
```

## Verification Files

### ads.txt
- **Location:** `/public/ads.txt`
- **URL:** `https://sedat.netlify.app/ads.txt`
- **Content:** 
  ```
  google.com, pub-7766172957848399, DIRECT, f08c47fec0942fa0
  ```
- **Purpose:** Required by Google to verify authorized digital sellers

### Meta Tag
- Added to `index.html` head section
- Helps Google verify site ownership
- Format: `<meta name="google-adsense-account" content="ca-pub-7766172957848399">`

## Testing

To verify AdSense is loading correctly:

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open browser developer tools
3. Go to the Network tab
4. Filter for "adsbygoogle" or "googlesyndication"
5. You should see a request to `pagead2.googlesyndication.com`

6. Check for AdSense object in Console:
   ```javascript
   window.adsbygoogle
   ```

## Security Configuration

The following security measures are in place:

### Content Security Policy (CSP)
Updated to allow:
- **script-src:** AdSense JavaScript files
- **frame-src:** AdSense ad iframes
- **connect-src:** AdSense API connections
- **img-src:** All HTTPS images (for ad images)

### CORS
- AdSense script loaded with `crossorigin="anonymous"`
- Ensures proper cross-origin resource sharing

### Headers
- ads.txt served with proper MIME type: `text/plain; charset=utf-8`
- Appropriate cache control headers set

## robots.txt Configuration

Explicitly allows:
```
Allow: /ads.txt
Allow: /sitemap.xml
```

This ensures search engines and ad crawlers can access these important files.

## Common Issues and Solutions

### AdSense not showing ads

1. **New Account:** If your AdSense account is new, it may take 24-48 hours for ads to appear
2. **Site Under Review:** Google needs to review your site before showing ads
3. **Insufficient Content:** Make sure you have enough quality content on your blog
4. **Policy Violations:** Ensure your content complies with AdSense policies

### ads.txt Warnings

1. Verify ads.txt is accessible at `https://sedat.netlify.app/ads.txt`
2. Check that the file content matches your AdSense account
3. Allow 24-48 hours for Google to crawl the file

### CSP Errors

If you see Content Security Policy errors:
1. Check the netlify.toml CSP configuration
2. Ensure all AdSense domains are whitelisted
3. Redeploy after making changes

## Privacy and Compliance

### GDPR Considerations
- Consider implementing a cookie consent banner
- AdSense uses cookies for personalized advertising
- Provide privacy policy with information about ad serving

### Cookie Notice
You may want to add a cookie consent mechanism before loading AdSense:

```javascript
const initGoogleAdSense = () => {
  const hasConsent = checkUserConsent(); // Your consent mechanism
  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  
  if (hasConsent && adsenseClientId) {
    // Load AdSense script
  }
};
```

## Monitoring and Analytics

### AdSense Performance
- Monitor your AdSense dashboard regularly
- Check RPM (Revenue per thousand impressions)
- Analyze which pages/articles perform best

### Integration with Google Analytics
Both AdSense and Analytics are now active:
- Track page views with Analytics
- Monitor ad performance with AdSense
- Correlate content performance with ad revenue

## Best Practices

1. **Content Quality:** Focus on creating high-quality, original content
2. **Ad Placement:** Don't place too many ads - it can hurt user experience
3. **Mobile Responsive:** Use responsive ad units for mobile devices
4. **Page Speed:** Monitor that ads don't significantly slow down your site
5. **Policy Compliance:** Regularly review and follow AdSense policies

## Additional Resources

- [Google AdSense Help Center](https://support.google.com/adsense)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [ads.txt Guide](https://support.google.com/adsense/answer/7532444)
- [AdSense Code Implementation](https://support.google.com/adsense/answer/7584263)

## Support

If you encounter issues:
1. Check the Google AdSense Help Center
2. Verify all configuration steps in this guide
3. Use the Network tab in browser DevTools to debug script loading
4. Check the browser console for any JavaScript errors
