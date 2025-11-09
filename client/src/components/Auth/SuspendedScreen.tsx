import { useState } from 'react';
import './Auth.css';

interface SuspendedScreenProps {
  onReturnToLogin: () => void;
  onGoToContact: () => void;
}

function SuspendedScreen({ onReturnToLogin, onGoToContact }: SuspendedScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-card suspended-card">
        <div className="suspended-icon">🚫</div>
        <h1 className="auth-title">Account Suspended</h1>
        
        <div className="suspended-message">
          <p>Your account has been suspended due to multiple reports received.</p>
          <p>This action was taken to ensure the safety and quality of our community.</p>
        </div>

        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▼ Hide Details' : '▶ Show Details'}
        </button>

        {showDetails && (
          <div className="suspension-details">
            <h3>Why was my account suspended?</h3>
            <p>
              Your account received reports from other users that exceeded our threshold limit.
              Our system automatically suspends accounts when they reach a certain number of reports
              to maintain community safety.
            </p>
            
            <h3>What can I do?</h3>
            <ul>
              <li>If you believe this is a mistake, please contact our support team</li>
              <li>Review our Terms & Conditions and Community Guidelines</li>
              <li>Wait for our team to review your case</li>
            </ul>

            <h3>Next Steps:</h3>
            <p>
              Contact our support team through the contact form to appeal this suspension.
              Please provide your username and any relevant information about your case.
            </p>
          </div>
        )}

        <div className="suspended-actions">
          <button 
            className="suspended-button contact-button"
            onClick={onGoToContact}
          >
            📧 Contact Support
          </button>
          <button 
            className="suspended-button login-button"
            onClick={onReturnToLogin}
          >
            🔙 Return to Login
          </button>
        </div>

        <div className="suspended-footer">
          <p>Need immediate assistance? Email us at: support@netcify.com</p>
        </div>
      </div>
    </div>
  );
}

export default SuspendedScreen;
