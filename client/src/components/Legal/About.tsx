import { useEffect } from 'react';
import './Legal.css';

interface AboutProps {
  onClose: () => void;
}

function About({ onClose }: AboutProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="legal-header-content">
            <span className="legal-icon">ℹ️</span>
            <div className="modal-title-row">
              <h2>About Netcify</h2>
              <span className="esc-hint">ESC</span>
            </div>
          </div>
          <button className="legal-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="legal-modal-body">
          <div className="legal-content">
            <section className="legal-section">
              <p className="legal-intro">
                Welcome to <strong>Netcify</strong> - a modern, real-time chat application designed to connect people from around the world. Our platform provides a seamless communication experience with powerful features and an intuitive interface.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🎯 Our Mission</h3>
              <p>
                At Netcify, we believe in the power of instant communication. Our mission is to provide a secure, fast, and user-friendly platform where people can connect, share ideas, and build meaningful relationships through text, voice, and video conversations.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">✨ Key Features</h3>
              <ul className="legal-list">
                <li>Real-time messaging with instant delivery</li>
                <li>Public chat rooms for group discussions</li>
                <li>Private one-on-one conversations</li>
                <li><strong>Voice and video calling with enhanced mobile support</strong></li>
                <li>Location sharing with Google Maps integration</li>
                <li>Emoji support for expressive communication</li>
                <li>User profiles with customizable pictures</li>
                <li>Advanced filtering and search functionality</li>
                <li>Dark and light theme support</li>
                <li>Typing indicators and online status</li>
                <li><strong>Smart notification system with sound alerts</strong></li>
                <li><strong>Visual favicon badge for unread messages</strong></li>
                <li><strong>Browser title notifications when tab is inactive</strong></li>
                <li><strong>Do Not Disturb mode for focused work</strong></li>
              </ul>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🛡️ Privacy & Security</h3>
              <p>
                Your privacy and security are our top priorities. We implement industry-standard security measures to protect your data and ensure safe communication. All conversations are transmitted securely, and we never share your personal information with third parties without your consent.
              </p>
              <p>
                For more details about how we handle your data, please review our <strong>Privacy Policy</strong>.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🌍 Global Community</h3>
              <p>
                Netcify brings together users from diverse backgrounds and locations. Whether you're looking to make new friends, discuss common interests, or simply have casual conversations, our platform provides the perfect environment for global connectivity.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">💡 Technology</h3>
              <p>
                Built with cutting-edge web technologies, Netcify utilizes:
              </p>
              <ul className="legal-list">
                <li>React & TypeScript for a robust frontend</li>
                <li>Socket.IO for real-time communication</li>
                <li>WebRTC for voice and video calls</li>
                <li>MongoDB for efficient data storage</li>
                <li>Modern responsive design principles</li>
              </ul>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">👨‍💻 Development</h3>
              <p>
                Netcify is developed and maintained by <strong>Sedat ERGÖZ</strong>, a passionate software developer dedicated to creating exceptional user experiences. The platform is continuously updated with new features and improvements based on user feedback.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">📧 Get in Touch</h3>
              <p>
                We value your feedback and suggestions! If you have any questions, encounter issues, or want to share your ideas for improving Netcify, please don't hesitate to reach out through our <strong>Contact Us</strong> page.
              </p>
              <p>
                Follow us on social media and stay updated with the latest features and announcements.
              </p>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🎉 Recent Updates</h3>
              <p>
                We've recently enhanced Netcify with powerful new features:
              </p>
              <ul className="legal-list">
                <li><strong>Enhanced Voice Calls:</strong> Improved audio quality and mobile compatibility for voice calls, ensuring clear communication on all devices</li>
                <li><strong>Smart Notifications:</strong> Receive instant sound alerts for new messages, even when actively using the app</li>
                <li><strong>Visual Badge Indicators:</strong> See unread message counts directly on your browser tab and Windows taskbar icon</li>
                <li><strong>Browser Title Alerts:</strong> Tab title blinks with notification when you're viewing other tabs</li>
                <li><strong>Do Not Disturb Mode:</strong> Focus on your work by temporarily muting all notifications with a single click</li>
              </ul>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🚀 Future Plans</h3>
              <p>
                We're constantly working to enhance your experience on Netcify. Upcoming features include:
              </p>
              <ul className="legal-list">
                <li>Group video calls and conferences</li>
                <li>File sharing and media galleries</li>
                <li>Custom chat room creation</li>
                <li>Advanced user matching algorithms</li>
                <li>Mobile applications for iOS and Android</li>
                <li>Message reactions and threading</li>
                <li>Screen sharing during video calls</li>
              </ul>
            </section>

            <section className="legal-section">
              <h3 className="legal-subtitle">🙏 Acknowledgments</h3>
              <p>
                Special thanks to our amazing community of users who help make Netcify better every day. Your feedback, bug reports, and feature suggestions drive our continuous improvement.
              </p>
            </section>

            <div className="legal-footer">
              <p className="legal-updated">Version 1.1.0 • Last updated: January 11, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
