import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SocialPlatformAd from '../components/SocialPlatformAd';
import {
  LifeBuoy,
  MessagesSquare,
  Users,
  Video,
  PhoneCall,
  Bell,
  Search,
  UserRound,
  ShieldCheck,
  Zap,
  Rocket,
  Sparkles,
  Gamepad2,
  Cpu,

  MessageCircle,
  Globe,
  ArrowRight,
  Heart,
  Mail,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import '../styles/Support.css';

const PLATFORM_URL = 'https://netcify.netlify.app';

const roomVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } }
};

const rooms = [
  {
    name: 'General',
    desc: 'General discussion for everyone — say hello, share news, or just hang out.',
    icon: MessagesSquare,
    color: '#667eea'
  },
  {
    name: 'Gaming',
    desc: 'Talk about your favorite games, strategies and everything in between.',
    icon: Gamepad2,
    color: '#a855f7'
  },
  {
    name: 'Tech Talk',
    desc: 'Discuss technology, programming, tools and the latest in software.',
    icon: Cpu,
    color: '#0db7ed'
  },

];

const features = [
  {
    title: 'Real-time Messaging',
    desc: 'WebSocket-powered instant messaging with typing indicators and read receipts.',
    icon: MessageCircle
  },
  {
    title: 'Private Chats',
    desc: 'Secure 1-on-1 conversations with persistent history and unread badges.',
    icon: Users
  },
  {
    title: 'Voice & Video Calls',
    desc: 'High-quality peer-to-peer calls over WebRTC — start a call with one click.',
    icon: Video
  },
  {
    title: 'Smart Notifications',
    desc: 'Real-time push notifications so you never miss an important message.',
    icon: Bell
  },
  {
    title: 'User Search',
    desc: 'Find and connect with users by username or display name instantly.',
    icon: Search
  },
  {
    title: 'Profiles & Avatars',
    desc: 'Customizable profiles with photo upload, status and bio.',
    icon: UserRound
  }
];

const steps = [
  {
    n: '01',
    title: 'Create your free account',
    desc: 'Register on the platform with a username and password — or sign in instantly with Google OAuth.',
    icon: Rocket
  },
  {
    n: '02',
    title: 'Verify your email',
    desc: 'Confirm your email address to secure your account and unlock everything.',
    icon: Mail
  },
  {
    n: '03',
    title: 'Join a public room',
    desc: 'Pick the room for your favorite app or topic and start talking with the community in real time.',
    icon: MessagesSquare
  },
  {
    n: '04',
    title: 'Connect with anyone',
    desc: 'Message users directly, create private chats and launch voice or video calls.',
    icon: PhoneCall
  }
];

export default function Support() {
  const handleVisit = () => {
    window.open(PLATFORM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Helmet>
        <title>Support - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta
          name="description"
          content="Connect with our community, get help, and join the social platform. Every app has its own room where users can chat and contact each other in real time."
        />
      </Helmet>

      <motion.div
        className="platform-support-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hero Section */}
        <motion.section
          className="platform-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="platform-hero-badge">
            <LifeBuoy size={16} />
            Community &amp; Support
          </div>
          <h1>Support &amp; Our Social Platform</h1>
          <p className="platform-hero-subtitle">
            {import.meta.env.VITE_SITE_NAME || "We"} don't just write articles — we build tools
            and a connected community around them. Every app has its own room on our social
            platform where users meet, help each other, share ideas and contact each other in real time.
          </p>

          <div className="platform-hero-stats">
            <div className="platform-hero-stat">
              <span className="platform-stat-value">4+</span>
              <span className="platform-stat-label">Community Rooms</span>
            </div>
            <div className="platform-hero-stat">
              <span className="platform-stat-value">100%</span>
              <span className="platform-stat-label">Real-time &amp; Free</span>
            </div>
            <div className="platform-hero-stat">
              <span className="platform-stat-value">24/7</span>
              <span className="platform-stat-label">Contact &amp; Support</span>
            </div>
          </div>
        </motion.section>

        {/* Featured Platform (formerly homepage advertisement) */}
        <motion.section
          className="platform-ad-section"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SocialPlatformAd />
        </motion.section>

        {/* Rooms For Every App */}
        <motion.section
          className="platform-rooms"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="platform-section-header">
            <span className="platform-section-kicker">
              <Sparkles size={14} />
              Chat Rooms
            </span>
            <h2>A Room for Every App &amp; Topic</h2>
            <p className="platform-section-description">
              Each app we build gets its own dedicated public room on the social platform, so the
              people who use the same tools can meet, help each other and share tips. Join the
              conversation in a themed community room, or start your own — every room is a place
              where users can contact each other, ask questions and connect in real time. No
              registration barriers, no approval steps — just join and talk.
            </p>
          </div>

          <motion.div
            className="platform-rooms-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {rooms.map((room) => {
              const Icon = room.icon;
              return (
                <motion.article
                  key={room.name}
                  className="platform-room-card"
                  variants={roomVariants}
                  whileHover={{ y: -6 }}
                >
                  <div className="platform-room-icon" style={{ background: `${room.color}18`, color: room.color, borderColor: `${room.color}40` }}>
                    <Icon size={24} />
                  </div>
                  <h3>{room.name}</h3>
                  <p>{room.desc}</p>
                  <span className="platform-room-live">
                    <span className="platform-live-dot" />
                    Live community
                  </span>
                </motion.article>
              );
            })}

            <motion.article
              className="platform-room-card platform-room-card-app"
              variants={roomVariants}
              whileHover={{ y: -6 }}
            >
              <div className="platform-room-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}>
                <Sparkles size={24} />
              </div>
              <h3>Your App&apos;s Room</h3>
              <p>
                Apps like the 5 Free Apps Bundle have their own space too — ask questions,
                report issues and get help directly from other users.
              </p>
              <span className="platform-room-live">
                <span className="platform-live-dot" />
                Made for your app
              </span>
            </motion.article>
          </motion.div>
        </motion.section>

        {/* Communication Features */}
        <motion.section
          className="platform-features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="platform-section-header">
            <span className="platform-section-kicker">
              <Users size={14} />
              Stay Connected
            </span>
            <h2>Everything You Need to Talk</h2>
            <p className="platform-section-description">
              Beyond themed rooms, the platform is a full social network. Contact any user
              directly, get notified the second someone replies, and switch from text to a
              face-to-face video call without leaving the app.
            </p>
          </div>

          <div className="platform-features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  className="platform-feature-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="platform-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="platform-extra-features">
            <div className="platform-extra-feature">
              <CheckCircle2 size={16} />
              Typing indicators
            </div>
            <div className="platform-extra-feature">
              <CheckCircle2 size={16} />
              Read receipts
            </div>
            <div className="platform-extra-feature">
              <CheckCircle2 size={16} />
              Persistent message history
            </div>
            <div className="platform-extra-feature">
              <CheckCircle2 size={16} />
              Unread message badges
            </div>
            <div className="platform-extra-feature">
              <ShieldCheck size={16} />
              JWT-secured sessions
            </div>
            <div className="platform-extra-feature">
              <Zap size={16} />
              Google sign-in
            </div>
          </div>
        </motion.section>

        {/* Get Started */}
        <motion.section
          className="platform-steps-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="platform-section-header">
            <span className="platform-section-kicker">
              <Globe size={14} />
              Join Us
            </span>
            <h2>Register &amp; Start Using the Platform</h2>
            <p className="platform-section-description">
              Getting in touch with the community takes less than a minute. Register once and use
              the same account for every room, chat and call.
            </p>
          </div>

          <div className="platform-steps">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.n}
                  className="platform-step"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="platform-step-number">{step.n}</span>
                  <div className="platform-step-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="platform-cta">
            <button
              className="platform-cta-button"
              onClick={handleVisit}
              aria-label="Register and start chatting on the social platform"
            >
              <Rocket size={20} />
              <span>Register &amp; Chat Free</span>
              <ArrowRight size={18} />
            </button>
            <p className="platform-cta-note">
              Prefer the command line? Try the{' '}
              <a href="https://github.com/eaeoz/clchat" target="_blank" rel="noopener noreferrer">
                CLI chat app
              </a>{' '}
              on GitHub.
            </p>
          </div>
        </motion.section>

        {/* Help / Contact */}
        <motion.section
          className="platform-help"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="platform-help-icon">
            <Heart size={24} />
          </div>
          <h2>Still Need Help?</h2>
          <div className="platform-help-cards">
            <a className="platform-help-card" href="/contact">
              <Mail size={20} />
              <span className="platform-help-card-title">Contact Form</span>
              <span className="platform-help-card-desc">
                Send us a message — protected with reCAPTCHA.
              </span>
            </a>
            <a className="platform-help-card" href="/donate">
              <Heart size={20} />
              <span className="platform-help-card-title">Donate</span>
              <span className="platform-help-card-desc">
                Support our work with a small crypto donation.
              </span>
            </a>
            <button
              className="platform-help-card"
              onClick={handleVisit}
              aria-label="Ask questions live on the social platform"
            >
              <Terminal size={20} />
              <span className="platform-help-card-title">Ask Live</span>
              <span className="platform-help-card-desc">
                Get instant answers in the community rooms.
              </span>
            </button>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}