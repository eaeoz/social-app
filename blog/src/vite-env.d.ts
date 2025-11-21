/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_ARTICLES_COLLECTION_ID: string
  readonly VITE_SITE_URL: string
  readonly VITE_SITE_NAME: string
  readonly VITE_SITE_DESCRIPTION: string
  readonly VITE_SOCIAL_GITHUB: string
  readonly VITE_SOCIAL_LINKEDIN: string
  readonly VITE_SOCIAL_TWITTER: string
  readonly VITE_SOCIAL_INSTAGRAM: string
  readonly VITE_ADSENSE_CLIENT_ID: string
  readonly VITE_GOOGLETAG_ID: string
  readonly VITE_RECAPTCHA_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google Analytics types
interface Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}
