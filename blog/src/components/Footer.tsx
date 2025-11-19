import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      url: import.meta.env.VITE_SOCIAL_GITHUB,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: import.meta.env.VITE_SOCIAL_LINKEDIN,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: import.meta.env.VITE_SOCIAL_TWITTER,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: import.meta.env.VITE_SOCIAL_INSTAGRAM,
    },
  ].filter(link => link.url); // Only show links that have URLs configured

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</h3>
            <p>{import.meta.env.VITE_SITE_DESCRIPTION || "Modern tech blog with articles about software development"}</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <nav className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </nav>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <nav className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </nav>
          </div>

          {socialLinks.length > 0 && (
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={link.name}
                    >
                      <Icon size={20} />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
