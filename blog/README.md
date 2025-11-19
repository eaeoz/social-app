# Modern Blog Website

A modern, animated blog website built with React, TypeScript, and Vite. Features dark theme, dynamic search, and integration with Appwrite for content management.

## Features

- ✨ Modern, animated UI with Framer Motion
- 🌙 Dark theme by default
- 🔍 Dynamic search functionality
- 📱 Fully responsive design
- 🎨 Clean and professional design
- 📝 Article management via Appwrite
- 📧 Contact form with Netlify Functions
- 🔒 SEO optimized
- 🚀 Fast performance with code splitting
- 📄 Static pages (About, Privacy, Terms)
- 🔗 Social media integration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Appwrite
- **Deployment**: Netlify
- **Email**: Netlify Functions + Nodemailer

## Prerequisites

- Node.js 18+ and npm
- Appwrite account and project
- Netlify account (for deployment)
- SMTP credentials (for contact form)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_ARTICLES_COLLECTION_ID=your_articles_collection_id

# SMTP Configuration (for Netlify Functions)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_TO_EMAIL=recipient@example.com

# Site Configuration
VITE_SITE_URL=https://sedat.netlify.app
VITE_SITE_NAME=Sedat's Blog
VITE_SITE_DESCRIPTION=Modern tech blog with articles about software development

# Social Media Links
VITE_SOCIAL_GITHUB=https://github.com/yourusername
VITE_SOCIAL_LINKEDIN=https://linkedin.com/in/yourusername
VITE_SOCIAL_TWITTER=https://twitter.com/yourusername
VITE_SOCIAL_INSTAGRAM=https://instagram.com/yourusername

# Google AdSense (optional)
VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxx
```

## Installation

1. Clone the repository
```bash
cd blog
```

2. Install dependencies
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your credentials
```bash
cp .env.example .env
```

4. Generate sitemap
```bash
npm run generate-sitemap
```

## Development

Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:3001`

## Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Appwrite Setup

### Create Collections

1. Create a database in Appwrite
2. Create an "articles" collection with the following attributes:
   - `articleId` (string, required, size: 50)
   - `title` (string, required, size: 255)
   - `author` (string, required, size: 100)
   - `date` (string, required, size: 50) - Format: "Month DD, YYYY" or any date format
   - `tags` (string, required, size: 500) - Comma-separated tags
   - `logo` (string, optional, size: 10) - Image URL for article
   - `excerpt` (string, required, size: 500) - Short description
   - `content` (string, required, size: 50000) - Full article content

3. Set permissions:
   - Read access: Any
   - Write access: Restricted (admin only)

**Note:** The system automatically parses comma-separated tags and displays them nicely on the frontend.

## Deployment to Netlify

1. Push your code to GitHub

2. Connect your repository to Netlify

3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

4. Add environment variables in Netlify dashboard

5. Deploy!

## SEO Features

- Dynamic meta tags with React Helmet
- Sitemap generation
- robots.txt
- Semantic HTML
- Open Graph tags
- Optimized images with lazy loading

## Google AdSense Ready

The site is configured to work with Google AdSense:
- Security headers allow AdSense scripts
- CSP configured for AdSense domains
- Clean, content-focused layout
- Mobile-friendly design
- Fast loading times

## Project Structure

```
blog/
├── public/
│   ├── robots.txt
│   └── sitemap.xml (generated)
├── scripts/
│   └── generate-sitemap.js
├── src/
│   ├── components/
│   │   ├── ArticleCard.tsx
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── config/
│   │   └── appwrite.ts
│   ├── pages/
│   │   ├── About.tsx
│   │   ├── ArticleDetail.tsx
│   │   ├── Contact.tsx
│   │   ├── Home.tsx
│   │   ├── Privacy.tsx
│   │   └── Terms.tsx
│   ├── styles/
│   │   ├── ArticleCard.css
│   │   ├── ArticleDetail.css
│   │   ├── Contact.css
│   │   ├── Footer.css
│   │   ├── Header.css
│   │   ├── Home.css
│   │   └── StaticPage.css
│   ├── types/
│   │   └── article.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── netlify/
│   └── functions/
│       └── contact.ts
├── .env.example
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## License

MIT

## Support

For issues and questions, please use the contact form on the website or open an issue on GitHub.
