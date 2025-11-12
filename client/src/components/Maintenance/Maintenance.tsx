import { useState, useEffect } from 'react';
import './Maintenance.css';

interface MaintenanceProps {
  estimatedTime?: string;
  reason?: string;
}

function Maintenance({ estimatedTime, reason }: MaintenanceProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [contactEmail, setContactEmail] = useState('support@netcify.com');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch contact email from backend settings
  useEffect(() => {
    const fetchContactEmail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/site`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings?.siteEmail) {
            setContactEmail(data.settings.siteEmail);
          }
        }
      } catch (error) {
        console.error('Failed to fetch contact email:', error);
      }
    };

    fetchContactEmail();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="maintenance-container">
      <div className="maintenance-background">
        <div className="maintenance-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
          <div className="circle circle-4"></div>
        </div>
      </div>

      <div className="maintenance-content">
        <div className="maintenance-icon-container">
          <div className="maintenance-icon">
            <div className="gear gear-1">⚙️</div>
            <div className="gear gear-2">⚙️</div>
          </div>
        </div>

        <h1 className="maintenance-title">
          <span className="title-word">We're</span>
          <span className="title-word">Under</span>
          <span className="title-word">Maintenance</span>
        </h1>

        <p className="maintenance-description">
          {reason || "We're currently performing scheduled maintenance to improve your experience. We'll be back shortly!"}
        </p>

        <div className="maintenance-info-cards">
          <div className="info-card">
            <div className="card-icon">🕐</div>
            <div className="card-content">
              <div className="card-label">Current Time</div>
              <div className="card-value time-value">{formatTime(currentTime)}</div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <div className="card-label">Today's Date</div>
              <div className="card-value">{formatDate(currentTime)}</div>
            </div>
          </div>

          {estimatedTime && (
            <div className="info-card">
              <div className="card-icon">⏱️</div>
              <div className="card-content">
                <div className="card-label">Estimated Return</div>
                <div className="card-value">{estimatedTime}</div>
              </div>
            </div>
          )}
        </div>

        <div className="maintenance-status">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">Maintenance in Progress</span>
          </div>
        </div>

        <div className="maintenance-footer">
          <div className="footer-logo">
            <span className="logo-icon">💬</span>
            <span className="logo-text">Netcify</span>
          </div>
          <div className="footer-info">
            <p>For urgent matters, please contact us at:</p>
            <a href={`mailto:${contactEmail}`} className="contact-link" aria-label={`Send email to ${contactEmail}`}>
              {contactEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="maintenance-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}></div>
        ))}
      </div>
    </div>
  );
}

export default Maintenance;
