import './NSFWWarningModal.css';

interface NSFWWarningModalProps {
  warnings: string[];
  onContinue: () => void;
  onCancel: () => void;
}

function NSFWWarningModal({ warnings, onCancel }: NSFWWarningModalProps) {

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

        </div>

        <div className="nsfw-modal-actions nsfw-modal-actions-centered">
          <button
            className="nsfw-button nsfw-button-primary"
            onClick={onCancel}
          >
            Choose Different Image
          </button>
        </div>
      </div>
    </div>
  );
}

export default NSFWWarningModal;
