import express from 'express';
import { createTransport } from 'nodemailer';
import { getSiteSettings } from '../utils/initializeSiteSettings.js';

const router = express.Router();

// Contact form submission endpoint
router.post('/', async (req, res) => {
  try {
    const { username, email, subject, message } = req.body;

    // Validate request body
    if (!username || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get site settings to retrieve recipient email
    const siteSettings = await getSiteSettings();
    const RECIPIENT_EMAIL = siteSettings.siteEmail;

    // Check if site email is configured
    if (!RECIPIENT_EMAIL || RECIPIENT_EMAIL.trim() === '') {
      console.error('Site email not configured in settings');
      return res.status(500).json({
        success: false,
        message: 'Contact form is not configured. Please ask the administrator to set up the site email in settings.'
      });
    }

    // Get SMTP credentials from environment variables
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = process.env.SMTP_PORT || 587;

    // Check if SMTP credentials are configured
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact the administrator.'
      });
    }

    // Create transporter
    const transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    await transporter.verify();

    // Email content
    const mailOptions = {
      from: `"${username}" <${SMTP_USER}>`,
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: bold;
              color: #667eea;
              margin-bottom: 5px;
            }
            .field-value {
              background: white;
              padding: 12px;
              border-radius: 5px;
              border-left: 3px solid #667eea;
            }
            .message-box {
              background: white;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #764ba2;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${username}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="message-box">${message}</div>
            </div>
            <div class="footer">
              <p>This email was sent from your website's contact form.</p>
              <p>Reply directly to this email to respond to ${username}.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

From: ${username}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This email was sent from your website's contact form.
Reply to: ${email}
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Contact form email sent:', info.messageId);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('Error sending contact form email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send message. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please contact the administrator.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Unable to connect to email server. Please try again later.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

export default router;
