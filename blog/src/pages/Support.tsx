import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Bitcoin, Coins, Landmark, Copy, Check, Heart, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import '../styles/Support.css';

const paymentMethods = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Network',
    address: '14S98pyuGk6t6G43hDpYFQ9vUhhGQZvbuF',
    icon: Bitcoin,
    gradient: 'linear-gradient(135deg, #f7931a 0%, #b36b00 100%)',
    note: 'BTC payments are confirmed on the Bitcoin Network.'
  },
  {
    id: 'usdt',
    name: 'USDT',
    symbol: 'USDT',
    network: 'TRC20 (TRON)',
    address: 'TPcgKqs3sJqd62HQfv3RuVxURaGaVW35LQ',
    icon: Coins,
    gradient: 'linear-gradient(135deg, #26a17b 0%, #0f7a5c 100%)',
    note: 'USDT payments are sent via the TRC20 network on TRON.'
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum Mainnet (ERC20)',
    address: '0xf840b7e4ea2d0123e35d4e32c8b2179b9db5e9d2',
    icon: Landmark,
    gradient: 'linear-gradient(135deg, #627eea 0%, #3b5bd9 100%)',
    note: 'ETH and ERC20 tokens are accepted on Ethereum Mainnet. Also accepted: BNB, SOL, USDC, DOGE, ADA.'
  }
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 16 }
  }
};

export default function Support() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Support - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta
          name="description"
          content="Support our work with a crypto donation. Scan the QR code or copy a wallet address to send Bitcoin, USDT or Ethereum."
        />
      </Helmet>

      <motion.div
        className="support-page"
        initial="hidden"
        animate="show"
      >
        {/* Hero Section */}
        <motion.section
          className="support-hero"
          variants={{
            hidden: { opacity: 0, y: -20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
        >
          <div className="support-hero-badge">
            <Heart size={16} />
            Crypto Donations
          </div>
          <h1>Support Our Work</h1>
          <p className="support-hero-subtitle">
            {import.meta.env.VITE_SITE_NAME || "This blog"} is built with passion to share knowledge,
            tutorials and tools with the developer community — completely free of ads and paywalls.
            If our content helped you, a small donation keeps the lights on and helps us create
            even more useful articles, guides and open-source projects.
          </p>
          <div className="support-hero-benefits">
            <div className="support-benefit">
              <ShieldCheck size={18} />
              Secure & Transparent
            </div>
            <div className="support-benefit">
              <Zap size={18} />
              Instant Confirmation
            </div>
            <div className="support-benefit">
              <Sparkles size={18} />
              100% Appreciated
            </div>
          </div>
        </motion.section>

        {/* Payment Cards */}
        <motion.section
          className="support-cards"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isCopied = copiedId === method.id;

            return (
              <motion.article
                key={method.id}
                className="support-card"
                variants={cardVariants}
                whileHover={{ y: -6 }}
              >
                <div className="support-card-header">
                  <div
                    className="support-card-icon"
                    style={{ background: method.gradient }}
                  >
                    <Icon size={26} />
                  </div>
                  <div className="support-card-title">
                    <h2>{method.name}</h2>
                    <span className="support-symbol">{method.symbol}</span>
                  </div>
                  <span className="support-network">{method.network}</span>
                </div>

                <div className="support-qr-wrapper">
                  <div className="support-qr-glow" style={{ background: method.gradient }} />
                  <div className="support-qr-box">
                    <div className="support-qr-corners" />
                    <QRCodeSVG
                      value={method.address}
                      size={180}
                      level="M"
                      bgColor="transparent"
                      fgColor="#0f0f0f"
                      marginSize={0}
                    />
                  </div>
                  <p className="support-qr-hint">
                    Scan with your wallet to send {method.symbol}
                  </p>
                </div>

                <div className="support-address">
                  <code className="support-address-text">{method.address}</code>
                  <button
                    className={`support-copy-btn${isCopied ? ' copied' : ''}`}
                    onClick={() => handleCopy(method.id, method.address)}
                    aria-label={`Copy ${method.name} address`}
                    title="Copy address"
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p className="support-note">{method.note}</p>
              </motion.article>
            );
          })}
        </motion.section>

        {/* Footer Note */}
        <motion.section
          className="support-footnote"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.8 } }
          }}
        >
          <div className="support-footnote-icon">
            <Heart size={22} />
          </div>
          <h2>Thank You for Your Support</h2>
          <p>
            Every donation — no matter how small — directly supports the hosting, tools and time
            that go into creating free, high-quality content for everyone.
            After sending, please feel free to{' '}
            <a href="/contact">reach out</a> so we can personally thank you.
          </p>
          <p className="support-disclaimer">
            Please double-check that you are sending on the correct network.
            Transactions sent on the wrong network may be lost and cannot be recovered.
          </p>
        </motion.section>
      </motion.div>
    </>
  );
}