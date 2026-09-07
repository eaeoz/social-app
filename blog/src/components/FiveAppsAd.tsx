import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ExternalLink,
  Download,
  Film,
  Music,
  Youtube,
  Terminal,
  Newspaper,
  Sparkles,
  Star,
  MicVocal,
  Speech,
  Copy,
  Check,
  Info,
  AlertCircle,
  MousePointerClick,
  ShieldAlert,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import '../styles/FiveAppsAd.css';

const apps = [
  {
    name: 'YouTube Downloader',
    icon: Youtube,
    desc: 'Download YouTube videos & audio with format browser, playlists, and system tray',
    benefit: 'Watch offline, save data',
    color: '#ff4444',
    repo: 'https://github.com/eaeoz/youtube-downloader',
    installCode: 'iex (iwr -useb "https://tinyurl.com/ytdlps1")'
  },
  {
    name: 'Movie Downloader',
    icon: Film,
    desc: 'Torrent-based movie downloader with Letterboxd watchlist sync & built-in player',
    benefit: 'Your cinema, anytime',
    color: '#a855f7',
    repo: 'https://github.com/eaeoz/movie-downloader',
    installCode: 'iex (iwr -useb "https://tinyurl.com/mvdl108")'
  },
  {
    name: 'Music Downloader',
    icon: Music,
    desc: 'Search YouTube, fetch Deezer/iTunes metadata, and download high-quality MP3s',
    benefit: 'Fill your playlist',
    color: '#1ed760',
    repo: 'https://github.com/eaeoz/music-downloader',
    installCode: 'iex (iwr -useb "https://tinyurl.com/mscdl103")'
  },
  {
    name: 'Command Manager',
    icon: Terminal,
    desc: 'SSH command manager with GUI profiles & styled cards — Windows app or Docker',
    benefit: 'Boost productivity',
    color: '#0db7ed',
    repo: 'https://github.com/eaeoz/command-manager-docker',
    installCode: 'iex (iwr -useb "https://tinyurl.com/cmmgrps1")'
  },
  {
    name: 'VoiceEffect',
    icon: MicVocal,
    desc: 'Real-time voice changer with reverb, pitch shift & distortion at low latency',
    benefit: 'Sound like anyone',
    color: '#ff6bcb',
    repo: 'https://github.com/eaeoz/VoiceEffect',
    installCode: 'iex (iwr -useb "https://tinyurl.com/voiceffect203")'
  },
  {
    name: 'Sondakika Haber',
    icon: Newspaper,
    desc: 'Breaking news reader pulling headlines from 10+ major Turkish sources',
    benefit: 'Stay informed',
    color: '#f59e0b',
    repo: 'https://github.com/eaeoz/sondakika',
    bonus: true,
    installCode: 'iex (iwr -useb "https://tinyurl.com/sndkkps1")'
  },
  {
    name: 'Speech Type',
    icon: Speech,
    desc: 'Offline speech-to-text powered by whisper.cpp — no internet required',
    benefit: 'Type with your voice',
    color: '#22d3ee',
    repo: 'https://github.com/eaeoz/SpeechTypeProject',
    bonus: true,
    installCode: 'iex (iwr -useb "https://tinyurl.com/spchtyp")'
  }
];

const BULK_INSTALL_COMMAND =
  '"ytdlps1","mvdl108","mscdl103","cmmgrps1","voiceffect203" | ForEach-Object { iex (iwr -useb "https://tinyurl.com/$_") }';

export default function FiveAppsAd() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    setToastExiting(false);
    toastTimer.current = setTimeout(() => {
      setToastExiting(true);
      toastTimer.current = setTimeout(() => {
        setToast(null);
        setToastExiting(false);
      }, 400);
    }, 2600);
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        /* fall through to legacy fallback */
      }
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopy = async (index: number, code: string, appName: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedIndex(index);
      showToast(`${appName} install code copied!`);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      showToast(`Couldn't copy ${appName} code — please allow clipboard access`, 'error');
    }
  };

  const handleCopyBulk = async () => {
    const ok = await copyToClipboard(BULK_INSTALL_COMMAND);
    if (ok) {
      setBulkCopied(true);
      showToast('Bulk install command copied!');
      if (bulkResetTimer.current) clearTimeout(bulkResetTimer.current);
      bulkResetTimer.current = setTimeout(() => setBulkCopied(false), 2000);
    } else {
      showToast("Couldn't copy bulk command", 'error');
    }
  };

  const handleVisitRepo = (repo: string) => {
    window.open(repo, '_blank', 'noopener,noreferrer');
  };

  const toggleInstructions = () => setShowInstructions(!showInstructions);

  return (
    <div className="fiveapps-ad-container">
      {toast &&
        createPortal(
          <div
            className={`fiveapps-toast-notification fiveapps-toast-${toast.type}${toastExiting ? ' fiveapps-toast-exit' : ''}`}
            role="status"
            aria-live="polite"
          >
            {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>,
          document.body
        )}
      <div className="fiveapps-ad-content">
        <div className="fiveapps-ad-badge">
          <Sparkles size={16} />
          <span>Free Bundle</span>
        </div>

        <h2 className="fiveapps-ad-title">5 Free Apps Bundle</h2>

        <p className="fiveapps-ad-description">
          A powerful collection of free desktop tools — download videos, movies & music,
          manage commands, change your voice, read breaking news, and type by speaking.
          5 main apps + 2 bonus tools. No ads, no limits.
        </p>

        <div className="fiveapps-ad-features">
          {apps.map((app, i) => {
            const Icon = app.icon;
            return (
              <div
                key={i}
                role="link"
                tabIndex={0}
                aria-label={`Open ${app.name} on GitHub`}
                className={`fiveapps-ad-feature${app.bonus ? ' fiveapps-ad-feature-bonus' : ''}`}
                onClick={() => handleVisitRepo(app.repo)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleVisitRepo(app.repo);
                  }
                }}
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
                <div className="fiveapps-feature-install">
                  <button
                    className="fiveapps-install-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(i, app.installCode, app.name);
                    }}
                    aria-label={`Copy ${app.name} installation code`}
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check size={16} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Quick Install</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="fiveapps-click-hint">
          <MousePointerClick size={14} />
          Click any app to open its GitHub repository
        </p>

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
          onClick={() => handleVisitRepo('https://eaeoz.github.io/5_Free_Apps_Bundle')}
          aria-label="Get the 5 Free Apps Bundle"
        >
          <Download size={18} />
          <span>Download Bundle</span>
          <ExternalLink size={16} />
        </button>

        <div className="fiveapps-safety-info">
          <button
            className="fiveapps-safety-toggle"
            onClick={() => setShowSafetyInfo(!showSafetyInfo)}
            aria-expanded={showSafetyInfo}
          >
            <ShieldAlert size={16} />
            <span>Why does Windows show a warning?</span>
            <ChevronDown size={16} className={showSafetyInfo ? 'open' : ''} />
          </button>

          {showSafetyInfo && (
            <div className="fiveapps-safety-content">
              <p className="fiveapps-safety-intro">
                All these apps are <strong>100% free and open source</strong>, and this site runs
                without a payment gateway. Signing the downloadable executables requires a paid
                code-signing certificate, so the ready-made build is shipped unsigned. That's why
                Windows SmartScreen may show a red{' '}
                <em>&quot;Windows protected your PC / Unknown publisher&quot;</em> warning when you
                run a direct download — it's <strong>expected</strong>, not a sign of malware. If
                you trust the source, click <strong>More info</strong> then{' '}
                <strong>Run anyway</strong>.
              </p>

              <div className="fiveapps-safety-steps">
                <div className="fiveapps-safety-step">
                  <span className="fiveapps-safety-step-number">1</span>
                  <div className="fiveapps-safety-step-body">
                    <strong>View the source code</strong>
                    <span>
                      Click any app card above to open its GitHub repository and download every
                      line of the code.
                    </span>
                  </div>
                </div>
                <div className="fiveapps-safety-step">
                  <span className="fiveapps-safety-step-number">2</span>
                  <div className="fiveapps-safety-step-body">
                    <strong>Ask an AI bot to check it</strong>
                    <span>
                      Not sure? Paste the code into any AI assistant (ChatGPT, Claude, Gemini…) —
                      the projects are small, clean and easy to review.
                    </span>
                  </div>
                </div>
                <div className="fiveapps-safety-step">
                  <span className="fiveapps-safety-step-number">3</span>
                  <div className="fiveapps-safety-step-body">
                    <strong>Build or run it yourself</strong>
                    <span>
                      Each repo includes build instructions. Compile your own executable, or run it
                      directly on a Node.js environment — no installer needed.
                    </span>
                  </div>
                </div>
              </div>

              <p className="fiveapps-safety-note">
                <ShieldCheck size={15} />
                Prefer a completely transparent install? Skip the direct download, grab the source
                from the repo and build it yourself — the safest route, and every project runs on Node.
              </p>
            </div>
          )}
        </div>

        <div className="fiveapps-install-instructions">
          <button
            className="fiveapps-instructions-toggle"
            onClick={toggleInstructions}
            aria-expanded={showInstructions}
          >
            <Info size={16} />
            <span>{showInstructions ? 'Hide Installation Guide' : 'Show Installation Guide'}</span>
          </button>

          {showInstructions && (
            <div className="fiveapps-instructions-content">
              <h3 className="fiveapps-instructions-title">Quick Installation Guide</h3>
              <p className="fiveapps-instructions-text">
                Install any app in under a minute with one PowerShell command:
              </p>

              <div className="fiveapps-installation-steps">
                <div className="fiveapps-installation-step">
                  <span className="fiveapps-step-number">1</span>
                  <span className="fiveapps-step-title">Open PowerShell</span>
                  <span className="fiveapps-step-desc">
                    Press <kbd>Win</kbd> + <kbd>R</kbd>, type <code>powershell</code>, hit <kbd>Enter</kbd>
                  </span>
                </div>

                <div className="fiveapps-installation-step">
                  <span className="fiveapps-step-number">2</span>
                  <span className="fiveapps-step-title">Paste &amp; Run</span>
                  <span className="fiveapps-step-desc">
                    Click <strong>Quick Install</strong> on any app above, then paste and press <kbd>Enter</kbd>
                  </span>
                </div>

                <div className="fiveapps-installation-step">
                  <span className="fiveapps-step-number">3</span>
                  <span className="fiveapps-step-title">Enjoy!</span>
                  <span className="fiveapps-step-desc">
                    The app downloads and installs automatically
                  </span>
                </div>
              </div>

              <div className="fiveapps-installation-tip">
                <span className="fiveapps-tip-icon">💡</span>
                <div className="fiveapps-tip-body">
                  <span className="fiveapps-tip-text">
                    Want all 5 main apps at once? Copy this one-liner:
                  </span>
                  <div className="fiveapps-tip-code-row">
                    <code className="fiveapps-tip-code">{BULK_INSTALL_COMMAND}</code>
                    <button
                      className="fiveapps-tip-copy-button"
                      onClick={handleCopyBulk}
                      aria-label="Copy bulk installation command"
                    >
                      {bulkCopied ? (
                        <>
                          <Check size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fiveapps-ad-decoration">
        <div className="fiveapps-decoration-circle fiveapps-circle-1"></div>
        <div className="fiveapps-decoration-circle fiveapps-circle-2"></div>
        <div className="fiveapps-decoration-circle fiveapps-circle-3"></div>
      </div>
    </div>
  );
}
