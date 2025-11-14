import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './Blog.css';

interface BlogProps {
  onClose: () => void;
}

interface BlogArticle {
  id: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  content: string;
  excerpt: string;
}

// Sample blog articles with markdown content
const blogArticles: BlogArticle[] = [
  {
    id: '1',
    title: 'Introducing Real-Time Video Calls: Connect Face-to-Face',
    date: 'January 15, 2025',
    author: 'Sedat ERGÖZ',
    tags: ['Feature', 'Video Calls', 'WebRTC'],
    excerpt: 'Experience crystal-clear video calls with our new WebRTC integration...',
    content: `# Introducing Real-Time Video Calls

We're thrilled to announce the launch of our **real-time video calling feature**! Now you can connect with friends and colleagues face-to-face, no matter where you are in the world.

## What's New?

- **High-Quality Video**: Crystal-clear video powered by WebRTC technology
- **Voice Calls**: Don't need video? Switch to voice-only mode
- **Mobile Optimized**: Works seamlessly on all devices
- **Instant Connection**: Start calls with a single click

## How It Works

Starting a video call is simple:

1. Open a private chat with any user
2. Click the video call icon (🎥) in the chat header
3. Wait for the other person to accept
4. Enjoy your conversation!

## Technical Details

Our video calling feature uses **WebRTC** (Web Real-Time Communication), ensuring:

- Low latency connections
- Peer-to-peer communication for privacy
- Adaptive bitrate for varying network conditions
- End-to-end encryption

## Try It Now!

Head over to your private chats and give it a try. We'd love to hear your feedback!

---

*Stay tuned for more exciting updates coming soon!*`
  },
  {
    id: '2',
    title: 'Understanding Our Privacy Commitment: Your Data, Your Control',
    date: 'January 10, 2025',
    author: 'Sedat ERGÖZ',
    tags: ['Privacy', 'Security', 'Data Protection'],
    excerpt: 'Learn how we protect your privacy and give you control over your data...',
    content: `# Understanding Our Privacy Commitment

At Netcify, **your privacy is our top priority**. We believe in transparency and giving you complete control over your personal information.

## Our Core Principles

### 1. Data Minimization
We only collect data that's essential for providing our services. No unnecessary tracking, no hidden data collection.

### 2. Encryption First
All your messages and calls are encrypted in transit. Your conversations remain private between you and your contacts.

### 3. No Data Selling
We will **never** sell your personal data to third parties. Your information is yours alone.

### 4. User Control
You have full control over:
- Your profile information
- Message history
- Account deletion
- Data export

## What Data We Collect

- **Account Information**: Username, email, age, gender
- **Profile Data**: Display name, profile picture (optional)
- **Messages**: Stored securely and can be deleted
- **Usage Data**: Anonymous analytics to improve our service

## Your Rights

Under GDPR and other privacy laws, you have the right to:

1. **Access** your data
2. **Correct** inaccurate information
3. **Delete** your account and data
4. **Export** your information
5. **Object** to data processing

## Security Measures

- Regular security audits
- Industry-standard encryption
- Secure password hashing
- Two-factor authentication (coming soon)

---

*For more details, please read our complete [Privacy Policy](#).*`
  },
  {
    id: '3',
    title: 'Smart Notifications: Stay Connected Without the Overwhelm',
    date: 'January 5, 2025',
    author: 'Sedat ERGÖZ',
    tags: ['Feature', 'Notifications', 'UX'],
    excerpt: 'Discover how our new notification system keeps you informed without being intrusive...',
    content: `# Smart Notifications: Stay Connected Without the Overwhelm

We've completely redesigned our notification system to be **smarter, less intrusive, and more helpful**.

## What's Changed?

### Visual Indicators
- **Favicon Badge**: See unread message counts right in your browser tab
- **Title Alerts**: Tab title blinks when you have new messages in background tabs
- **Taskbar Badge**: Windows users see notification counts on the taskbar icon

### Sound Alerts
- **Customizable Tones**: Choose from multiple notification sounds
- **Context-Aware**: Different sounds for messages, calls, and system notifications
- **Volume Control**: Adjust notification volume independently

### Do Not Disturb Mode
Need to focus? Enable **DND mode** with one click:
- ⭐ Mute all notification sounds
- ⭐ Stop visual alerts
- ⭐ Still receive messages (check when ready)
- ⭐ Automatic status indicator for others

## How to Use DND

1. Click the notification icon (🔔) in the header
2. Toggle to mute (🔕)
3. Focus on your work!
4. Toggle back when you're ready

## Smart Filtering

Our notification system intelligently filters:
- **Priority Messages**: Never miss important conversations
- **Group Chats**: Customizable notification settings per room
- **Quiet Hours**: Automatically reduces notifications during specified times (coming soon)

## Browser Compatibility

Our notification system works on:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers

---

*Experience distraction-free communication today!*`
  },
  {
    id: '4',
    title: 'Building Netcify: Technology Stack and Architecture',
    date: 'December 28, 2024',
    author: 'Sedat ERGÖZ',
    tags: ['Technology', 'Development', 'Architecture'],
    excerpt: 'A deep dive into the technology powering Netcify...',
    content: `# Building Netcify: Technology Stack and Architecture

Ever wondered what powers Netcify? Let's take a **behind-the-scenes look** at our technology stack and architecture decisions.

## Frontend Stack

### React + TypeScript
We chose React with TypeScript for:
- 🎯 **Type Safety**: Catch errors before they reach production
- ⚡ **Performance**: Virtual DOM for lightning-fast updates
- 🧩 **Component Reusability**: Build once, use everywhere
- 🔧 **Developer Experience**: Excellent tooling and IDE support

### Real-Time Communication
- **Socket.IO**: Bidirectional, event-based communication
- **WebRTC**: Peer-to-peer video/audio calls
- **Optimistic Updates**: Instant UI feedback

### UI/UX Libraries
- **Emoji Picker React**: Rich emoji support
- **React Markdown**: Beautiful content rendering
- **Custom CSS**: Handcrafted animations and transitions

## Backend Architecture

### Node.js + Express
Our server is built with:
- **Express.js**: Fast, minimalist web framework
- **Socket.IO**: Real-time bidirectional event-based communication
- **JWT**: Secure authentication tokens
- **Bcrypt**: Industry-standard password hashing

### Database
- **MongoDB**: Flexible document database
  - User profiles
  - Messages
  - Room configurations
  - Chat history

### Authentication & Security
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse and spam
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Sanitize all user inputs

## Infrastructure

### Deployment
- **Frontend**: Netlify (CDN distribution)
- **Backend**: Railway/Render (containerized deployment)
- **Database**: MongoDB Atlas (managed cloud database)

### Performance Optimizations
- **Code Splitting**: Load only what you need
- **Image Optimization**: Compressed and cached
- **Lazy Loading**: Components load on demand
- **Service Workers**: Offline support (coming soon)

## Security Measures

1. **Encryption**: All data encrypted in transit (HTTPS)
2. **Authentication**: Secure JWT-based auth
3. **Rate Limiting**: Prevent brute force attacks
4. **Input Sanitization**: XSS and injection protection
5. **NSFW Detection**: AI-powered content moderation

## Future Enhancements

We're constantly improving. Coming soon:
- 📱 Progressive Web App (PWA) support
- 🌐 Internationalization (i18n)
- 🔐 End-to-end encryption for messages
- 📊 Advanced analytics dashboard
- 🤖 AI-powered chat suggestions

---

*Want to contribute or learn more? [Contact us](#)!*`
  },
  {
    id: '5',
    title: 'Community Guidelines: Creating a Positive Environment',
    date: 'December 20, 2024',
    author: 'Sedat ERGÖZ',
    tags: ['Community', 'Guidelines', 'Safety'],
    excerpt: 'Learn about our community guidelines and how we maintain a safe, respectful environment...',
    content: `# Community Guidelines: Creating a Positive Environment

Netcify is built on **respect, kindness, and positive communication**. Our community guidelines ensure everyone has a great experience.

## Core Values

### 1. Respect Others
- Treat everyone with dignity and respect
- Respect different opinions and perspectives
- No harassment, bullying, or hate speech
- Be patient with new users

### 2. Stay Safe
- Protect your personal information
- Don't share sensitive data in public rooms
- Report suspicious behavior
- Use privacy settings wisely

### 3. Be Authentic
- Use your real age and gender
- Don't impersonate others
- Profile pictures should represent you
- Be honest in your communications

### 4. Keep It Legal
- Follow all applicable laws
- No illegal content or activities
- Respect intellectual property
- No spam or phishing attempts

## What's Not Allowed

### ❌ Prohibited Content
- Hate speech or discrimination
- Harassment or bullying
- Sexual or adult content
- Violence or threats
- Illegal activities
- Spam or scams
- Impersonation
- Misinformation

### ❌ Prohibited Behavior
- Creating fake accounts
- Systematic rule violations
- Evading bans with new accounts
- Coordinated harassment
- Platform manipulation

## Content Moderation

### AI-Powered Detection
We use advanced AI to detect:
- **NSFW Images**: Automatic scanning of profile pictures
- **Profanity**: Real-time message filtering
- **Spam Patterns**: Suspicious activity detection

### User Reporting
Help us maintain quality:
- Report inappropriate content
- Flag suspicious users
- Provide context for reports
- Support community moderation

## Consequences

Violations may result in:

1. **Warning**: First-time minor violations
2. **Temporary Suspension**: Repeated or moderate violations
3. **Permanent Ban**: Severe or repeated violations
4. **Legal Action**: Illegal activities reported to authorities

## User Rights

You have the right to:
- Appeal moderation decisions
- Request data deletion
- Export your information
- Understand why action was taken

## Privacy & Safety Tips

### For Your Safety
- 🔒 Never share passwords
- 🚫 Don't share financial information
- 📧 Verify email requests
- 🔐 Use strong, unique passwords
- 👀 Be cautious with strangers

### For Others' Safety
- ✅ Report violations
- 🤝 Support victims of harassment
- 📚 Educate about safe practices
- 💬 Promote positive communication

## Reporting Process

1. **Identify**: Notice a violation
2. **Report**: Use the report button
3. **Provide Details**: Explain the issue
4. **Review**: Our team investigates
5. **Action**: Appropriate measures taken
6. **Feedback**: You're informed of the outcome

---

*Together, we can build a safe and welcoming community for everyone!*`
  },
  {
    id: '6',
    title: 'Location Sharing: Stay Connected in the Real World',
    date: 'December 15, 2024',
    author: 'Sedat ERGÖZ',
    tags: ['Feature', 'Location', 'Maps'],
    excerpt: 'Learn how to safely share your location and meet up with friends...',
    content: `# Location Sharing: Stay Connected in the Real World

Our **location sharing feature** helps you coordinate meetups and share your favorite places with friends.

## How It Works

### Sharing Your Location
1. Click the location icon (📍) in the chat
2. Grant browser permission (first time only)
3. Confirm you want to share
4. Your location is sent as a Google Maps link

### What Gets Shared
- Your current GPS coordinates
- A clickable Google Maps link
- An embedded map preview
- No continuous tracking

## Privacy & Security

### Your Control
- ✅ Share only when you choose
- ✅ One-time sharing (not continuous)
- ✅ Clear consent required
- ✅ Revoke permission anytime

### Best Practices
- 🔐 Only share with trusted contacts
- 👥 Avoid sharing in public rooms
- 🏠 Be cautious about home location
- ⏰ Consider timing of shares

## Use Cases

### Meeting Up
> "Let's meet at the coffee shop!"
> *Shares location of the café*

### Finding Friends
> "I'm here at the park"
> *Shares current location*

### Recommending Places
> "This restaurant is amazing!"
> *Shares restaurant location*

### Emergency Situations
> "Need help, here's where I am"
> *Quick location share*

## Technical Details

### How We Protect Your Privacy
1. **No Storage**: Locations aren't stored on our servers
2. **No Tracking**: We don't track your movements
3. **Encrypted Transit**: Location data is encrypted
4. **User Consent**: Explicit permission required

### Browser Permissions
We request:
- Geolocation API access
- Only when you initiate sharing
- Can be revoked in browser settings

### Accuracy
Location accuracy depends on:
- GPS availability
- Device capabilities
- Network connection
- Environmental factors

## Safety Guidelines

### Do's ✅
- Share with trusted friends
- Use for legitimate meetups
- Review who can see your location
- Update permissions regularly

### Don'ts ❌
- Don't share in public chats
- Avoid over-sharing your routine
- Don't share with strangers
- Never share home address publicly

## Troubleshooting

### Can't Share Location?
- Check browser permissions
- Enable GPS on device
- Try different browser
- Check internet connection

### Location Inaccurate?
- Move to open area
- Wait for better GPS signal
- Restart browser
- Clear browser cache

---

*Share safely and connect with confidence!*`
  }
];

function Blog({ onClose }: BlogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedArticle) {
          handleCloseArticle();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectedArticle]);

  useEffect(() => {
    if (!selectedArticle) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [selectedArticle]);

  const handleOpenArticle = (article: BlogArticle) => {
    setIsExpanding(true);
    setTimeout(() => {
      setSelectedArticle(article);
      setIsExpanding(false);
    }, 300);
  };

  const handleCloseArticle = () => {
    setIsCollapsing(true);
    setTimeout(() => {
      setSelectedArticle(null);
      setIsCollapsing(false);
    }, 300);
  };

  const filteredArticles = blogArticles.filter(article => {
    if (searchQuery.length < 3) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query)) ||
      article.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className="legal-modal-overlay blog-modal-overlay" onClick={selectedArticle ? undefined : onClose}>
      <div 
        className={`legal-modal-content blog-modal-content ${selectedArticle ? 'article-expanded' : ''} ${isExpanding ? 'expanding' : ''} ${isCollapsing ? 'collapsing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!selectedArticle ? (
          <>
            <div className="legal-modal-header blog-header">
              <div className="legal-header-content">
                <span className="legal-icon">📝</span>
                <h2>Blog</h2>
              </div>
              <button className="legal-modal-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="blog-search-section">
              <div className="blog-search-container">
                <span className="blog-search-icon">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="blog-search-input"
                  placeholder="Search articles... (min 3 characters)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="blog-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <div className="blog-search-hint">
                  Type at least 3 characters to search
                </div>
              )}
              {searchQuery.length >= 3 && filteredArticles.length === 0 && (
                <div className="blog-search-hint">
                  No articles found matching "{searchQuery}"
                </div>
              )}
            </div>

            <div className="legal-modal-body blog-list-body">
              <div className="blog-articles-grid">
                {filteredArticles.map((article, index) => (
                  <article
                    key={article.id}
                    className="blog-article-card"
                    onClick={() => handleOpenArticle(article)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="blog-article-header">
                      <div className="blog-article-logo">📝</div>
                      <div className="blog-article-meta">
                        <time className="blog-article-date">{article.date}</time>
                        <span className="blog-article-author">By {article.author}</span>
                      </div>
                    </div>
                    <h3 className="blog-article-title">{article.title}</h3>
                    <p className="blog-article-excerpt">{article.excerpt}</p>
                    <div className="blog-article-tags">
                      {article.tags.map((tag) => (
                        <span key={tag} className="blog-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="blog-article-footer">
                      <span className="blog-read-more">
                        Read more <span className="blog-arrow">→</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              className="blog-article-close"
              onClick={handleCloseArticle}
              aria-label="Close article"
              title="Close article (ESC)"
            >
              ×
            </button>
            <div className="blog-article-content">
              <div className="blog-article-header-full">
                <div className="blog-article-logo-large">📝</div>
                <div className="blog-article-tags-full">
                  {selectedArticle.tags.map((tag) => (
                    <span key={tag} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="blog-article-title-full">{selectedArticle.title}</h1>
                <div className="blog-article-meta-full">
                  <time className="blog-article-date">{selectedArticle.date}</time>
                  <span className="blog-meta-separator">•</span>
                  <span className="blog-article-author">By {selectedArticle.author}</span>
                </div>
              </div>
              <div className="blog-article-body markdown-content">
                <ReactMarkdown>
                  {selectedArticle.content}
                </ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Blog;
