import { ExternalLink, Link2, Zap, BarChart3, Shield, Sparkles } from 'lucide-react';
import '../styles/DiverterAd.css';

export default function DiverterAd() {
  const handleVisit = () => {
    window.open('https://diverter.netlify.app', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="diverter-ad-container">
      <div className="diverter-ad-content">
        <div className="diverter-ad-badge">
          <Sparkles size={16} />
          <span>Featured Tool</span>
        </div>

        <div className="diverter-ad-header">
          <Link2 className="diverter-logo-icon" size={40} />
          <h2 className="diverter-ad-title">
            Diverter
          </h2>
        </div>

        <p className="diverter-ad-tagline">
          Simplify Your Links, Amplify Your Reach
        </p>

        <p className="diverter-ad-description">
          Transform long, complex URLs into short, memorable links with Diverter. 
          Track clicks, manage your links, and boost your online presence with our 
          powerful yet simple link shortening service.
        </p>

        <div className="diverter-ad-features">
          <div className="diverter-ad-feature">
            <Zap className="diverter-feature-icon" size={20} />
            <span>Instant Shortening</span>
          </div>
          <div className="diverter-ad-feature">
            <BarChart3 className="diverter-feature-icon" size={20} />
            <span>Analytics & Stats</span>
          </div>
          <div className="diverter-ad-feature">
            <Shield className="diverter-feature-icon" size={20} />
            <span>Secure & Reliable</span>
          </div>
        </div>

        <button 
          className="diverter-ad-button"
          onClick={handleVisit}
          aria-label="Try Diverter link shortener"
        >
          <span>Try Diverter Now</span>
          <ExternalLink size={18} />
        </button>

        <p className="diverter-ad-footer">
          Free to use • No registration required • Privacy focused
        </p>
      </div>

      <div className="diverter-ad-decoration">
        <div className="diverter-decoration-circle circle-1"></div>
        <div className="diverter-decoration-circle circle-2"></div>
        <div className="diverter-decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
