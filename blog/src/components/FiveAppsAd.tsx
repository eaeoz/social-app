import { ExternalLink, Download, Film, Music, Youtube, Terminal, Newspaper, Sparkles, Star, MicVocal, Speech } from 'lucide-react';
import '../styles/FiveAppsAd.css';

const apps = [
  {
    name: 'YouTube Downloader',
    icon: Youtube,
    desc: 'Download YouTube videos & audio with format browser, playlists, and system tray',
    benefit: 'Watch offline, save data',
    color: '#ff4444',
    repo: 'https://github.com/eaeoz/youtube-downloader'
  },
  {
    name: 'Movie Downloader',
    icon: Film,
    desc: 'Torrent-based movie downloader with Letterboxd watchlist sync & built-in player',
    benefit: 'Your cinema, anytime',
    color: '#a855f7',
    repo: 'https://github.com/eaeoz/movie-downloader'
  },
  {
    name: 'Music Downloader',
    icon: Music,
    desc: 'Search YouTube, fetch Deezer/iTunes metadata, and download high-quality MP3s',
    benefit: 'Fill your playlist',
    color: '#1ed760',
    repo: 'https://github.com/eaeoz/music-downloader'
  },
  {
    name: 'Command Manager',
    icon: Terminal,
    desc: 'SSH command manager with GUI profiles & styled cards — Windows app or Docker',
    benefit: 'Boost productivity',
    color: '#0db7ed',
    repo: 'https://github.com/eaeoz/command-manager-docker'
  },
  {
    name: 'VoiceEffect',
    icon: MicVocal,
    desc: 'Real-time voice changer with reverb, pitch shift & distortion at low latency',
    benefit: 'Sound like anyone',
    color: '#ff6bcb',
    repo: 'https://github.com/eaeoz/VoiceEffect'
  },
  {
    name: 'Sondakika Haber',
    icon: Newspaper,
    desc: 'Breaking news reader pulling headlines from 10+ major Turkish sources',
    benefit: 'Stay informed',
    color: '#f59e0b',
    repo: 'https://github.com/eaeoz/sondakika',
    bonus: true
  },
  {
    name: 'Speech Type',
    icon: Speech,
    desc: 'Offline speech-to-text powered by whisper.cpp — no internet required',
    benefit: 'Type with your voice',
    color: '#22d3ee',
    repo: 'https://github.com/eaeoz/SpeechTypeProject',
    bonus: true
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
          A powerful collection of free desktop tools — download videos, movies & music,
          manage commands, change your voice, read breaking news, and type by speaking.
          5 main apps + 2 bonus tools. No ads, no limits.
        </p>

        <div className="fiveapps-ad-features">
          {apps.map((app, i) => {
            const Icon = app.icon;
            return (
              <a
                key={i}
                href={app.repo}
                target="_blank"
                rel="noopener noreferrer"
                className={`fiveapps-ad-feature${app.bonus ? ' fiveapps-ad-feature-bonus' : ''}`}
                aria-label={`${app.name} on GitHub`}
              >
                <div
                  className="fiveapps-feature-icon-wrapper"
                  style={{ background: `${app.color}20`, borderColor: `${app.color}40` }}
                >
                  <Icon size={20} style={{ color: app.color }} />
                </div>
                <div className="fiveapps-feature-text">
                  <span className="fiveapps-feature-name">
                    {app.name}
                    {app.bonus && <span className="fiveapps-feature-bonus-badge">Bonus</span>}
                    <ExternalLink size={12} className="fiveapps-feature-link-icon" />
                  </span>
                  <span className="fiveapps-feature-desc">{app.desc}</span>
                  <span className="fiveapps-feature-benefit">
                    <Star size={10} style={{ color: app.color }} />
                    {app.benefit}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="fiveapps-ad-stats">
          <div className="fiveapps-ad-stat">
            <span className="fiveapps-stat-number">7</span>
            <span className="fiveapps-stat-label">Projects</span>
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
