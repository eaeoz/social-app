import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, HandCoins } from 'lucide-react';
import '../styles/DonateStats.css';

interface DonateAsset {
  asset: string;
  free: number;
  locked: number;
  total: number;
  priceTry: number | null;
  priceUsdt: number | null;
  change24h: number | null;
  pair: string | null;
  valueTry: number | null;
  valueUsdt: number | null;
}

interface DonateStatsData {
  ok: boolean;
  generatedAt: string;
  lastUpdated: string;
  totalTry: number;
  totalUsdt: number;
  totalBtc: number;
  assets: DonateAsset[];
}

const DEFAULT_API = 'https://sedat.komuta.net.tr/';

const API_URL = import.meta.env.VITE_DONATE_STATS_API || DEFAULT_API;

function formatTry(value: number, digits: number = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: digits,
  }).format(value);
}

function formatUsdt(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
}

function assetLabel(asset: DonateAsset): string {
  const name = asset.asset;
  const usdt = asset.valueUsdt;
  const value = usdt !== null ? ` · ${formatUsdt(usdt)}` : '';
  return `${name}${value}`;
}

export default function DonateStats() {
  const [data, setData] = useState<DonateStatsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Bad response');
        return res.json();
      })
      .then((json: DonateStatsData) => {
        if (cancelled) return;
        if (!json?.ok) throw new Error('API not ok');
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || error) return null;

  const assets = data.assets ?? [];
  const shownAssets = assets.filter((a) => a.total > 0 && a.asset !== 'TRY');

  return (
    <motion.div
      className="donate-stats"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="donate-stats-inner">
        <span className="donate-stats-icon" aria-hidden="true">
          <Heart size={14} />
        </span>
        <p className="donate-stats-text">
          <HandCoins size={14} className="donate-stats-hand" aria-hidden="true" />
          <span>
            Total donated to keep this blog free:{' '}
            <strong>{formatTry(data.totalTry)}</strong>
            <span className="donate-stats-sep">·</span>
            <strong>{formatUsdt(data.totalUsdt)}</strong>
            <span className="donate-stats-sep">·</span>
            <strong>{formatBtc(data.totalBtc)}</strong>
          </span>
          <Link to="/donate" className="donate-stats-link">
            Donate
          </Link>
        </p>

        {shownAssets.length > 0 && (
          <div className="donate-stats-assets">
            {shownAssets.map((asset) => (
              <span key={asset.asset} className="donate-stats-chip" title={asset.pair ?? asset.asset}>
                {assetLabel(asset)}
                {asset.change24h !== null && (
                  <span className={`donate-stats-change ${asset.change24h >= 0 ? 'up' : 'down'}`}>
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}