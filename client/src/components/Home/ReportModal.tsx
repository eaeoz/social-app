import { useState } from 'react';
import './ReportModal.css';

interface ReportModalProps {
  reportedUser: {
    userId: string;
    username: string;
    displayName: string;
  };
  onClose: () => void;
  onSubmit?: (reportData: { subject: string; description: string }) => void;
}

function ReportModal({ reportedUser, onClose, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    'Spam or misleading content',
    'Harassment or bullying',
    'Hate speech or discrimination',
    'Inappropriate content',
    'Impersonation',
    'Scam or fraud',
    'Violence or threats',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/report/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId: reportedUser.userId,
          reason: selectedReason
        })
      });

      if (response.ok) {
        alert('Report submitted successfully. Thank you for helping keep our community safe.');
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>Report User</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body report-modal-body">
          <div className="report-user-info">
            <p>You are reporting: <strong>{reportedUser.displayName}</strong></p>
            <p className="report-warning">
              ⚠️ Please select the reason for your report. False reports may result in action against your account.
            </p>
          </div>

          <div className="report-reasons">
            <label className="report-label">Select a reason:</label>
            {reportReasons.map((reason) => (
              <label key={reason} className="report-reason-item">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  disabled={isSubmitting}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="report-actions">
            <button
              className="report-button cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="report-button submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedReason}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
