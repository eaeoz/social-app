import { ExternalLink, Users, MessageCircle, Heart, Sparkles, Terminal } from 'lucide-react';
import '../styles/SocialPlatformAd.css';

export default function SocialPlatformAd() {
  const handleVisit = () => {
    window.open('https://netcify.netlify.app', '_blank', 'noopener,noreferrer');
  };

  const handleCliChat = () => {
    window.open('https://github.com/eaeoz/clchat', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="social-ad-container">
      <div className="social-ad-content">
        <div className="social-ad-badge">
          <Sparkles size={16} />
          <span>Featured Platform</span>
        </div>

        <h2 className="social-ad-title">
          Join Our Social Platform!
        </h2>

        <p className="social-ad-description">
          Connect with people worldwide through real-time messaging, voice & video calls, 
          and collaborative features. Join our growing community today!
        </p>

        <div className="social-ad-features">
          <div className="social-ad-feature">
            <MessageCircle className="feature-icon" size={20} />
            <span>Private & Group Chat</span>
          </div>
          <div className="social-ad-feature">
            <Users className="feature-icon" size={20} />
            <span>Voice & Video Calls</span>
          </div>
          <div className="social-ad-feature">
            <Heart className="feature-icon" size={20} />
            <span>Collaborative Whiteboard</span>
          </div>
        </div>

        <div className="social-ad-buttons">
          <button
            className="social-ad-button"
            onClick={handleVisit}
            aria-label="Visit our social platform"
          >
            <span>Visit Platform</span>
            <ExternalLink size={18} />
          </button>

          <button
            className="social-ad-button social-ad-button-secondary"
            onClick={handleCliChat}
            aria-label="Download the CLChat CLI app on GitHub"
          >
            <Terminal size={18} />
            <span>CLI Chat App</span>
          </button>
        </div>
      </div>

      <div className="social-ad-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
