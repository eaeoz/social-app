// SEO Meta Tags Utility
// Dynamically updates page title, description, and Open Graph tags

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

const defaultSEO: SEOData = {
  title: 'Netcify - Real-Time Chat | Instant Messaging & Video Calls',
  description: 'Netcify: Real-time chat platform for instant messaging and video calls. Connect worldwide with voice calls and online chat features.',
  keywords: 'chat platform, real-time chat, instant messaging, voice calls, video calls, social platform, online chat, messaging app, chat application, video conferencing, group chat, private messaging',
  ogTitle: 'Netcify - Connect, Chat & Share with the World',
  ogDescription: 'Join Netcify for instant messaging, voice & video calls, and connect with people worldwide. Experience seamless real-time communication in a modern social platform.',
  twitterTitle: 'Netcify - Connect, Chat & Share with the World',
  twitterDescription: 'Join Netcify for instant messaging, voice & video calls, and connect with people worldwide. Experience seamless real-time communication.'
};

const pageSEO: Record<string, SEOData> = {
  '/': defaultSEO,
  
  '/about': {
    title: 'About Netcify - Real-Time Social Chat Platform',
    description: 'Learn about Netcify, a modern real-time chat platform connecting people worldwide. Discover our mission, features, and commitment to seamless communication.',
    keywords: 'about netcify, chat platform information, social networking, real-time communication, messaging platform, video calling platform',
    ogTitle: 'About Netcify - Modern Real-Time Chat Platform',
    ogDescription: 'Discover Netcify\'s mission to connect people worldwide through instant messaging, voice & video calls. Learn about our features and commitment to communication.',
    twitterTitle: 'About Netcify - Real-Time Chat Platform',
    twitterDescription: 'Learn about Netcify\'s mission to connect people worldwide with instant messaging and video calls.'
  },
  
  '/contact': {
    title: 'Contact Us - Netcify Support & Help Center',
    description: 'Contact Netcify support team for help with your account, technical issues, or general inquiries. Get in touch via our contact form or email.',
    keywords: 'contact netcify, customer support, help center, technical support, contact form, get help, support team',
    ogTitle: 'Contact Netcify - Get Support & Help',
    ogDescription: 'Need help with Netcify? Contact our support team for assistance with your account, technical issues, or any questions about our platform.',
    twitterTitle: 'Contact Netcify Support',
    twitterDescription: 'Get in touch with Netcify support for help with your account or technical issues.'
  },
  
  '/privacy': {
    title: 'Privacy Policy - Netcify Data Protection & Security',
    description: 'Read Netcify\'s Privacy Policy to understand how we collect, use, and protect your personal information. Your privacy and data security are our priorities.',
    keywords: 'privacy policy, data protection, user privacy, personal information, data security, netcify privacy, GDPR compliance',
    ogTitle: 'Netcify Privacy Policy - Your Data Protection',
    ogDescription: 'Understand how Netcify collects, uses, and protects your personal information. Learn about our commitment to data security and user privacy.',
    twitterTitle: 'Netcify Privacy Policy',
    twitterDescription: 'Learn how Netcify protects your personal information and ensures data security.'
  },
  
  '/terms': {
    title: 'Terms & Conditions - Netcify Service Agreement',
    description: 'Read Netcify\'s Terms & Conditions to understand the rules, guidelines, and legal agreements for using our chat platform and services.',
    keywords: 'terms and conditions, terms of service, user agreement, service rules, legal terms, netcify terms, usage policy',
    ogTitle: 'Netcify Terms & Conditions - Service Agreement',
    ogDescription: 'Review Netcify\'s Terms & Conditions to understand the rules and guidelines for using our real-time chat platform and communication services.',
    twitterTitle: 'Netcify Terms & Conditions',
    twitterDescription: 'Read the terms and conditions for using Netcify\'s chat platform and services.'
  },
  
  '/verify-email': {
    title: 'Email Verification - Netcify Account Activation',
    description: 'Verify your email address to activate your Netcify account and start connecting with people worldwide through instant messaging and video calls.',
    keywords: 'email verification, account activation, verify account, netcify signup, account confirmation',
    ogTitle: 'Verify Your Netcify Account',
    ogDescription: 'Complete your Netcify registration by verifying your email address. Activate your account to start chatting and connecting.',
    twitterTitle: 'Verify Netcify Account',
    twitterDescription: 'Verify your email to activate your Netcify account and start connecting.'
  },
  
  '/reset-password': {
    title: 'Reset Password - Netcify Account Recovery',
    description: 'Reset your Netcify password to regain access to your account. Secure password recovery for your chat platform account.',
    keywords: 'reset password, password recovery, forgot password, account recovery, netcify login help',
    ogTitle: 'Reset Your Netcify Password',
    ogDescription: 'Forgot your password? Reset your Netcify account password securely to regain access to your account.',
    twitterTitle: 'Reset Netcify Password',
    twitterDescription: 'Securely reset your Netcify password to regain account access.'
  }
};

/**
 * Updates document meta tags based on the current route
 * @param path - The current route path (e.g., '/about', '/contact')
 */
export function updateSEOTags(path: string): void {
  const seoData = pageSEO[path] || defaultSEO;
  
  // Update page title
  document.title = seoData.title;
  
  // Update meta description
  updateMetaTag('name', 'description', seoData.description);
  
  // Update meta keywords
  if (seoData.keywords) {
    updateMetaTag('name', 'keywords', seoData.keywords);
  }
  
  // Update Open Graph tags
  updateMetaTag('property', 'og:title', seoData.ogTitle || seoData.title);
  updateMetaTag('property', 'og:description', seoData.ogDescription || seoData.description);
  updateMetaTag('property', 'og:url', `https://netcify.netlify.app${path}`);
  
  // Update Twitter Card tags
  updateMetaTag('name', 'twitter:title', seoData.twitterTitle || seoData.ogTitle || seoData.title);
  updateMetaTag('name', 'twitter:description', seoData.twitterDescription || seoData.ogDescription || seoData.description);
  
  // Update canonical URL
  updateCanonicalURL(path);
}

/**
 * Updates or creates a meta tag
 * @param attrName - The attribute name ('name' or 'property')
 * @param attrValue - The attribute value (e.g., 'description', 'og:title')
 * @param content - The content for the meta tag
 */
function updateMetaTag(attrName: string, attrValue: string, content: string): void {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
}

/**
 * Updates the canonical URL
 * @param path - The current route path
 */
function updateCanonicalURL(path: string): void {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (canonical) {
    canonical.href = `https://netcify.netlify.app${path}`;
  } else {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = `https://netcify.netlify.app${path}`;
    document.head.appendChild(canonical);
  }
}

/**
 * Resets SEO tags to default (homepage)
 */
export function resetSEOTags(): void {
  updateSEOTags('/');
}
