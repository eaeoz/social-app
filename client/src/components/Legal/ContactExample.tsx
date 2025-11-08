import React, { useState } from 'react';
import axios from 'axios';

/**
 * Example Contact Form Component using Netlify Function
 * 
 * This component demonstrates how to use the Netlify serverless function
 * for sending contact form emails using MongoDB credentials instead of
 * environment variables or Render backend.
 */

interface ContactFormData {
  username: string;
  email: string;
  subject: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

const ContactExample: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    username: '',
    email: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({
    loading: false,
    success: null,
    message: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setStatus({
      loading: true,
      success: null,
      message: ''
    });

    try {
      // Call Netlify serverless function
      // Option 1: Using /api/contact (via redirect in netlify.toml)
      const response = await axios.post<ApiResponse>('/api/contact', formData);
      
      // Option 2: Direct function URL (alternative)
      // const response = await axios.post<ApiResponse>('/.netlify/functions/contact', formData);

      console.log('Contact form response:', response.data);

      setStatus({
        loading: false,
        success: true,
        message: response.data.message
      });

      // Clear form on success
      setFormData({
        username: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Contact form error:', error);

      let errorMessage = 'Failed to send message. Please try again.';

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      setStatus({
        loading: false,
        success: false,
        message: errorMessage
      });
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us</h2>
      <p className="subtitle">
        This form uses Netlify serverless function with MongoDB credentials
      </p>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="username">Name *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={status.loading}
            placeholder="Your name"
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
            required
            disabled={status.loading}
            placeholder="your.email@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={status.loading}
            placeholder="Message subject"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            disabled={status.loading}
            placeholder="Your message here..."
            rows={6}
          />
        </div>

        {status.message && (
          <div className={`alert ${status.success ? 'alert-success' : 'alert-error'}`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="submit-button"
        >
          {status.loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <style>{`
        .contact-form-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .contact-form-container h2 {
          color: #667eea;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .alert-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .submit-button {
          padding: 14px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ContactExample;
