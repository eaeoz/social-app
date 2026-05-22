import { ExternalLink, Download, Film, Music, Youtube, Terminal, Newspaper, Sparkles, Star } from 'lucide-react';
import '../styles/FiveAppsAd.css';

const apps = [
  {
    name: 'YouTube Downloader',
    icon: Youtube,
    desc: 'Download any YouTube video or playlist in HD quality with subtitle support',
    benefit: 'Watch offline, save data',
    color: '#ff4444'
  },
  {
    name: 'Movie Downloader',
    icon: Film,
    desc: 'Search and download movies from multiple sources with one click',
    benefit: 'Your cinema, anytime',
    color: '#a855f7'
  },
  {
    name: 'Music Downloader',
    icon: Music,
    desc: 'Find and download any song or album in high-quality audio formats',
    benefit: 'Fill your playlist',
    color: '#22c55e'
  },
  {
    name: 'Command Manager',
    icon: Terminal,
    desc: 'Organize, automate & run terminal commands via a clean Docker-powered UI',
    benefit: 'Boost productivity',
    color: '#0ea5e9'
  },
  {
    name: 'Sondakika Haber',
    icon: Newspaper,
    desc: 'Real-time breaking news reader pulling headlines from top Turkish sources',
    benefit: 'Stay informed',
    color: '#f59e0b'
  }
];

export default function FiveAppsAd() {
  const handleVisit = () => {
    window.open('https://eaeoz.github.io/5_Free_Apps_Bundle', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fiveapps-ad-container">
      <div className="fiveapps-ad-content">
        <div className="fiveapps-ad-badge">
          <Sparkles size={16} />
          <span>Free Bundle</span>
        </div>

        <h2 className="fiveapps-ad-title">
          5 Free Apps Bundle
        </h2>

        <p className="fiveapps-ad-description">
          A powerful collection of free desktop tools — download videos, movies, music, 
          manage commands, and follow breaking news. All in one bundle. No ads, no limits.
        </p>

        <div className="fiveapps-ad-features">
          {apps.map((app, i) => {
            const Icon = app.icon;
            return (
              <div key={i} className="fiveapps-ad-feature">
                <div
                  className="fiveapps-feature-icon-wrapper"
                  style={{ background: `${app.color}20`, borderColor: `${app.color}40` }}
                >
                  <Icon size={20} style={{ color: app.color }} />
                </div>
                <div className="fiveapps-feature-text">
                  <span className="fiveapps-feature-name">{app.name}</span>
                  <span className="fiveapps-feature-desc">{app.desc}</span>
                  <span className="fiveapps-feature-benefit">
                    <Star size={10} style={{ color: app.color }} />
                    {app.benefit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fiveapps-ad-stats">
          <div className="fiveapps-ad-stat">
            <span className="fiveapps-stat-number">5</span>
            <span className="fiveapps-stat-label">Free Apps</span>
          </div>
          <div className="fiveapps-ad-stat">
            <span className="fiveapps-stat-number">100%</span>
            <span className="fiveapps-stat-label">Free</span>
          </div>
          <div className="fiveapps-ad-stat">
            <span className="fiveapps-stat-number">0</span>
            <span className="fiveapps-stat-label">Ads</span>
          </div>
        </div>

        <button
          className="fiveapps-ad-button"
          onClick={handleVisit}
          aria-label="Get the 5 Free Apps Bundle"
        >
          <Download size={18} />
          <span>Download Bundle</span>
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="fiveapps-ad-decoration">
        <div className="fiveapps-decoration-circle fiveapps-circle-1"></div>
        <div className="fiveapps-decoration-circle fiveapps-circle-2"></div>
        <div className="fiveapps-decoration-circle fiveapps-circle-3"></div>
      </div>
    </div>
  );
}
