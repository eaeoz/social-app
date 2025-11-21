import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import App from './App.tsx'
import './index.css'

// Initialize Google Tag Manager
const initGoogleTagManager = () => {
  const gtmId = import.meta.env.VITE_GOOGLE_GTM;
  
  if (gtmId) {
    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Create and append GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }
};

// Initialize Google Analytics
const initGoogleAnalytics = () => {
  const googleTagId = import.meta.env.VITE_GOOGLETAG_ID;
  
  if (googleTagId) {
    // Create and append gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', googleTagId);

    // Make gtag globally available
    (window as any).gtag = gtag;
  }
};

// Initialize Google Tag Manager and Analytics on app load
initGoogleTagManager();
initGoogleAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head'
      }}
    >
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>,
)
