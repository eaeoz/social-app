import React, { useState, useEffect } from 'react';
import './Legal.css';

interface ContactProps {
  onClose: () => void;
}

const Contact: React.FC<ContactProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ESC key press globally
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username.trim() || !formData.email.trim() || 
        !formData.subject.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // In production (Netlify): use Netlify function
      // In development (localhost): use Render backend API
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const endpoint = isLocalhost 
        ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/contact'
        : '/.netlify/functions/contact';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          username: '',
          email: '',
          subject: '',
          message: ''
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-title-row">
              <h2>Contact Us</h2>
              <span className="esc-hint">ESC</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="modal-body contact-modal-body">
          <p className="contact-intro">
            Have a question or feedback? We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="contact-form" onKeyDown={handleKeyDown}>
            <div className="form-group">
              <label htmlFor="username">Name *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Your name"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={isSubmitting}
                required
                className="subject-select"
              >
                <option value="">Select a subject...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Account Issues">Account Issues</option>
                <option value="Report User/Abuse">Report User/Abuse</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Privacy Concerns">Privacy Concerns</option>
                <option value="Billing/Subscription">Billing/Subscription</option>
                <option value="Partnership/Business">Partnership/Business</option>
                <option value="Feedback/Suggestions">Feedback/Suggestions</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more..."
                rows={6}
                disabled={isSubmitting}
                required
              />
            </div>

            {submitStatus === 'success' && (
              <div className="submit-status success">
                <span className="status-icon">✓</span>
                Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="submit-status error">
                <span className="status-icon">✕</span>
                {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="button-spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
