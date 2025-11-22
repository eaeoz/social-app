# Google Analytics Setup Guide

This guide explains how Google Analytics (GA4) has been integrated into the blog application.

## Overview

Google Analytics is dynamically loaded using the environment variable `VITE_GOOGLETAG_ID`. The implementation loads the gtag.js script and initializes tracking automatically when the application starts.

## Configuration

### Environment Variable

Add your Google Analytics Measurement ID to the `.env` file:

```env
VITE_GOOGLETAG_ID=G-1X79JXJNE9
```

**Note:** Replace `G-1X79JXJNE9` with your actual Google Analytics Measurement ID from your GA4 property.

### For Netlify Deployment

When deploying to Netlify, add the environment variable in your site settings:

1. Go to Site settings → Environment variables
2. Add a new variable:
   - **Key:** `VITE_GOOGLETAG_ID`
   - **Value:** `G-1X79JXJNE9` (or your GA4 Measurement ID)
3. Redeploy your site

## Implementation Details

### Files Modified

1. **`blog/src/main.tsx`**
   - Added `initGoogleAnalytics()` function that dynamically loads the gtag.js script
   - Reads the Measurement ID from `import.meta.env.VITE_GOOGLETAG_ID`
   - Initializes the dataLayer and gtag function
   - Runs automatically when the application starts

2. **`blog/src/vite-env.d.ts`**
   - Added TypeScript type definitions for `VITE_GOOGLETAG_ID`
   - Added Window interface extensions for `dataLayer` and `gtag` function

3. **`blog/.env`**
   - Added `VITE_GOOGLETAG_ID=G-1X79JXJNE9`

4. **`blog/.env.example`**
   - Added example configuration for future reference

## How It Works

1. When the app loads, `initGoogleAnalytics()` is called
2. The function checks if `VITE_GOOGLETAG_ID` is configured
3. If configured, it:
   - Creates a script tag pointing to `https://www.googletagmanager.com/gtag/js?id=YOUR_ID`
   - Initializes the `window.dataLayer` array
   - Creates and configures the `gtag()` function
   - Makes gtag globally available for custom tracking events

## Testing

To verify Google Analytics is working:

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open your browser's developer tools
3. Go to the Network tab
4. Filter for "gtag" or "google-analytics"
5. You should see a request to `www.googletagmanager.com/gtag/js`

6. In the Console tab, type:
   ```javascript
   window.dataLayer
   ```
   You should see an array with tracking events

## Custom Event Tracking

You can track custom events using the globally available `gtag` function:

```javascript
// Example: Track a custom event
window.gtag('event', 'button_click', {
  event_category: 'engagement',
  event_label: 'signup_button',
  value: 1
});
```

## Privacy Considerations

- Google Analytics tracking only activates if `VITE_GOOGLETAG_ID` is configured
- If the environment variable is not set or empty, no tracking scripts are loaded
- Consider adding a cookie consent banner for GDPR compliance

## Troubleshooting

### Analytics not loading

1. Check that `VITE_GOOGLETAG_ID` is set in your `.env` file
2. Verify the Measurement ID format (should be `G-XXXXXXXXXX`)
3. Make sure to restart the dev server after changing `.env` file
4. Check browser console for any errors

### No data in Google Analytics

1. Verify your GA4 property is properly configured
2. Check that the Measurement ID matches your GA4 property
3. Wait 24-48 hours for data to appear (GA4 has a processing delay)
4. Use Google Analytics DebugView for real-time debugging

## Security Notes

- The `VITE_GOOGLETAG_ID` is a public identifier and safe to expose in client-side code
- It cannot be used to access your Google Analytics account
- Only page views and events sent from your domain will be tracked

## Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [gtag.js Developer Guide](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
