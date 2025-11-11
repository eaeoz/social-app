import { useState } from 'react';
import './NSFWWarningModal.css';

interface NSFWWarningModalProps {
  warnings: string[];
  onContinue: () => void;
  onCancel: () => void;
}

function NSFWWarningModal({ warnings, onContinue, onCancel }: NSFWWarningModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="nsfw-modal-overlay">
      <div className="nsfw-modal">
        <div className="nsfw-modal-icon">🚫</div>
        <h2 className="nsfw-modal-title">Inappropriate Content Detected</h2>
        
        <div className="nsfw-modal-content">
          <p className="nsfw-modal-description">
            Our automated content detection system has identified that your image may contain inappropriate content:
          </p>
          
          <ul className="nsfw-warnings-list">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>

          <div className="nsfw-modal-info">
            <p><strong>Community Guidelines:</strong></p>
            <p>
              Profile pictures must not contain:
            </p>
            <ul>
              <li>Explicit sexual content or nudity</li>
              <li>Suggestive or provocative imagery</li>
              <li>Violence or disturbing content</li>
              <li>Illegal or harmful material</li>
            </ul>
          </div>

          <div className="nsfw-acknowledgment">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>
                I understand this image violates community guidelines. I will select a different image.
              </span>
            </label>
          </div>
        </div>

        <div className="nsfw-modal-actions">
          <button
            className="nsfw-button nsfw-button-cancel"
            onClick={onCancel}
          >
            Choose Different Image
          </button>
          <button
            className="nsfw-button nsfw-button-continue"
            onClick={onContinue}
            disabled={!acknowledged}
            title={!acknowledged ? 'Please acknowledge the guidelines' : ''}
          >
            Upload Anyway (Not Recommended)
          </button>
        </div>

        <p className="nsfw-modal-footer">
          * False positives may occur. If you believe this is an error, you can proceed at your own risk.
        </p>
      </div>
    </div>
  );
}

export default NSFWWarningModal;
