import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv,
  Eye,
  CalendarClock,
  Radio,
  ExternalLink,
  Gamepad2,
  Heart,
  Users,
  Zap
} from 'lucide-react';
import '../styles/TwitchStream.css';

interface TwitchStreamData {
  live: boolean;
  channel: string;
  displayName: string;
  avatar: string | null;
  title: string | null;
  game: string | null;
  viewers: number;
  startedAt: string | null;
  thumbnail: string | null;
  followers: number;
  bitrate: number | null;
}

type StreamState = 'loading' | 'live' | 'offline' | 'hidden';

const REFRESH_MS = 60000;

function formatUptime(startedAt: string | null): string {
  if (!startedAt) return '00:00:00';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function TwitchStream() {
  const [state, setState] = useState<StreamState>('loading');
  const [data, setData] = useState<TwitchStreamData | null>(null);
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/.netlify/functions/twitch-status', {
          headers: { Accept: 'application/json' }
        });

        if (!res.ok) {
          if (res.status === 503 || res.status === 502) {
            if (!cancelled) setState('hidden');
          }
          return;
        }

        const json = (await res.json()) as TwitchStreamData;

        if (cancelled) return;

        setData(json);
        setState(json.live ? 'live' : 'offline');

        if (json.live) {
          setUptime(formatUptime(json.startedAt));
        }
      } catch (err) {
        console.warn('Twitch status fetch failed:', err);
        if (!cancelled) setState('hidden');
      }
    };

    fetchStatus();
    const poll = setInterval(fetchStatus, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (state !== 'live') return;
    const tick = setInterval(() => setUptime(formatUptime(data?.startedAt ?? null)), 1000);
    return () => clearInterval(tick);
  }, [state, data?.startedAt]);

  const hostname = window.location.hostname || 'localhost';
  const embedUrl =
    data && data.channel
      ? `https://player.twitch.tv/?channel=${encodeURIComponent(data.channel)}&parent=${encodeURIComponent(hostname)}&muted=true&autoplay=true`
      : '';

  const twitchUrl = data && data.channel ? `https://www.twitch.tv/${encodeURIComponent(data.channel)}` : 'https://www.twitch.tv';

  if (state === 'hidden') {
    return null;
  }

  return (
    <section className="twitch-section" aria-label="Live Twitch stream">
      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.div
            key="loading"
            className="twitch-card twitch-loading"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            <div className="twitch-loading-top">
              <div className="twitch-loading-orb" />
              <div className="twitch-loading-lines">
                <span className="twitch-loading-line w70" />
                <span className="twitch-loading-line w45" />
              </div>
            </div>
            <div className="twitch-loading-panel" />
            <div className="twitch-loading-footer">
              <span className="twitch-loading-chip" />
              <span className="twitch-loading-chip" />
              <span className="twitch-loading-chip" />
            </div>
            <div className="twitch-loading-status">
              <span className="twitch-equalizer">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>Connecting to Twitch...</span>
            </div>
          </motion.div>
        )}

        {state === 'live' && data && (
          <motion.div
            key="live"
            className="twitch-card twitch-live"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            <header className="twitch-live-header">
              <div className="twitch-live-badge">
                <span className="twitch-live-dot" />
                LIVE
              </div>
              <div className="twitch-live-title-line">
                <p className="twitch-live-title" title={data.title ?? ''}>
                  {data.title || 'Live stream in progress'}
                </p>
              </div>
              <div className="twitch-live-meta">
                {data.game && (
                  <span className="twitch-live-chip">
                    <Gamepad2 size={13} />
                    {data.game}
                  </span>
                )}
                <span className="twitch-live-chip twitch-chip-viewers">
                  <Eye size={13} />
                  {data.viewers.toLocaleString()}
                </span>
                <span className="twitch-live-chip twitch-chip-uptime">
                  <CalendarClock size={13} />
                  {uptime}
                </span>
                {data.bitrate != null && (
                  <span className="twitch-live-chip">
                    <Zap size={13} />
                    {Math.round(data.bitrate / 1000)} Mbps
                  </span>
                )}
              </div>
            </header>

            <div className="twitch-video-wrap">
              <iframe
                className="twitch-video-frame"
                src={embedUrl}
                title="Twitch live stream"
                allow="autoplay; fullscreen"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
              />
              <div className="twitch-video-glow" />
            </div>

            <footer className="twitch-live-footer">
              <div className="twitch-live-host">
                {data.avatar ? (
                  <img className="twitch-avatar" src={data.avatar} alt={data.displayName} />
                ) : (
                  <div className="twitch-avatar twitch-avatar-fallback">
                    <Tv size={16} />
                  </div>
                )}
                <div className="twitch-live-host-info">
                  <span className="twitch-live-host-name">{data.displayName}</span>
                  <span className="twitch-live-host-followers">
                    <Heart size={11} />
                    {data.followers.toLocaleString()} followers
                  </span>
                </div>
              </div>

              <a
                className="twitch-watch-btn"
                href={twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Radio size={15} />
                <span>Watch on Twitch</span>
                <ExternalLink size={13} />
              </a>
            </footer>
          </motion.div>
        )}

        {state === 'offline' && (
          <motion.div
            key="offline"
            className="twitch-card twitch-offline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            <div className="twitch-offline-art" aria-hidden="true">
              <Tv size={42} className="twitch-offline-tv" />
              <span className="twitch-offline-ring" />
              <span className="twitch-offline-ring ring2" />
            </div>
            <div className="twitch-offline-badge">OFFLINE</div>
            <h3 className="twitch-offline-title">Twitch Stream: Offline</h3>
            <p className="twitch-offline-text">
              I'm not live right now. Check back soon or hit follow to catch the next stream.
            </p>
            <a
              className="twitch-watch-btn twitch-offline-btn"
              href={twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Users size={15} />
              <span>Go to my Twitch channel</span>
              <ExternalLink size={13} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}