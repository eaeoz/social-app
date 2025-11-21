import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import App from './App.tsx'
import './index.css'

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

// Initialize Google AdSense
const initGoogleAdSense = () => {
  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  
  if (adsenseClientId) {
    // Create and append AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
};

// Initialize Google Analytics and AdSense on app load
initGoogleAnalytics();
initGoogleAdSense();

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
