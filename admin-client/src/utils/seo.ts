/**
 * SEO utility functions for managing page metadata dynamically
 */

interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string;
}

const baseTitle = 'Netcify Admin Dashboard';

const pageMetadata: Record<string, PageMetadata> = {
  '/': {
    title: `Statistics - ${baseTitle}`,
    description: 'View real-time platform statistics, user analytics, and system metrics',
    keywords: 'admin statistics, platform analytics, user metrics, system dashboard'
  },
  '/login': {
    title: `Login - ${baseTitle}`,
    description: 'Secure admin login for Netcify platform management',
    keywords: 'admin login, secure access, authentication'
  },
  '/users': {
    title: `User Management - ${baseTitle}`,
    description: 'Manage users, view profiles, and moderate user accounts',
    keywords: 'user management, account moderation, user profiles'
  },
  '/rooms': {
    title: `Room Management - ${baseTitle}`,
    description: 'Monitor and manage chat rooms and conversations',
    keywords: 'room management, chat rooms, conversation monitoring'
  },
  '/reports': {
    title: `Reports - ${baseTitle}`,
    description: 'Review and manage user reports and content moderation',
    keywords: 'content moderation, user reports, report management'
  },
  '/archived-reports': {
    title: `Archived Reports - ${baseTitle}`,
    description: 'View archived reports and moderation history',
    keywords: 'archived reports, moderation history, past reports'
  },
  '/settings': {
    title: `Settings - ${baseTitle}`,
    description: 'Configure platform settings and administration options',
    keywords: 'platform settings, admin configuration, system settings'
  },
  '/cleanup': {
    title: `Cleanup Tools - ${baseTitle}`,
    description: 'Database cleanup and maintenance utilities',
    keywords: 'database cleanup, maintenance tools, system cleanup'
  }
};

/**
 * Update the document title based on current route
 */
export const updatePageTitle = (path: string): void => {
  const metadata = pageMetadata[path] || {
    title: baseTitle
  };
  
  document.title = metadata.title;
};

/**
 * Update meta description tag
 */
export const updateMetaDescription = (path: string): void => {
  const metadata = pageMetadata[path];
  if (!metadata?.description) return;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', metadata.description);
};

/**
 * Update meta keywords tag
 */
export const updateMetaKeywords = (path: string): void => {
  const metadata = pageMetadata[path];
  if (!metadata?.keywords) return;

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', metadata.keywords);
};

/**
 * Update Open Graph meta tags
 */
export const updateOpenGraphTags = (path: string): void => {
  const metadata = pageMetadata[path];
  if (!metadata) return;

  // Update OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', metadata.title);

  // Update OG Description
  if (metadata.description) {
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', metadata.description);
  }
};

/**
 * Update all SEO metadata for the current page
 */
export const updatePageMetadata = (path: string): void => {
  updatePageTitle(path);
  updateMetaDescription(path);
  updateMetaKeywords(path);
  updateOpenGraphTags(path);
};

/**
 * Set custom page title
 */
export const setCustomTitle = (title: string): void => {
  document.title = `${title} - ${baseTitle}`;
};
