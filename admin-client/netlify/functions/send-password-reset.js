import nodemailer from 'nodemailer';

// SMTP credentials from Netlify environment variables
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');

// Frontend URL for reset link
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'https://netcify.netlify.app';

// Debug logging helper
function debugLog(stage, data) {
  console.log('='.repeat(80));
  console.log(`[DEBUG] ${stage}`);
  console.log('Timestamp:', new Date().toISOString());
  if (data) {
    console.log('Details:', JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(80));
}

// Netlify serverless function handler
export async function handler(event, context) {
  debugLog('🚀 Send Password Reset Email Function Invoked', {
    httpMethod: event.httpMethod,
    hasBody: !!event.body
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    // Parse request body
    const { email, username, resetToken } = JSON.parse(event.body);

    debugLog('📝 Request Data', { email, username, hasToken: !!resetToken });

    // Validate inputs
    if (!email || !username || !resetToken) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email, username, and reset token are required'
        })
      };
    }

    // Validate SMTP configuration
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('❌ Missing SMTP credentials');
      
      // Return the reset link so admin can send it manually
      const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email service not configured',
          resetLink: resetLink,
          note: 'SMTP credentials not configured. Please add SMTP environment variables to Netlify.'
        })
      };
    }

    // Create transporter
    debugLog('📮 Creating Email Transporter', {
      host: SMTP_HOST,
      port: SMTP_PORT
    });

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter
    await transporter.verify();
    debugLog('✅ Transporter Verified');

    // Create reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: `"netcify" <${SMTP_USER}>`,
      to: email,
      subject: '🔑 Password Reset Request - netcify',
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
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              margin: 20px;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header .icon {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 20px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.8;
              color: #555;
              margin-bottom: 30px;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 18px 50px;
              border-radius: 50px;
              font-size: 18px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
              border: none;
              cursor: pointer;
            }
            .reset-button:hover {
              transform: translateY(-2px);
            }
            .or-text {
              text-align: center;
              color: #999;
              margin: 20px 0;
              font-size: 14px;
            }
            .link-box {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #667eea;
              word-wrap: break-word;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 30px 0;
              border-radius: 5px;
            }
            .warning-icon {
              font-size: 24px;
              margin-right: 10px;
            }
            .security-notice {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 30px 0;
              border-radius: 5px;
            }
            .footer {
              background: #f9f9f9;
              padding: 30px;
              text-align: center;
              font-size: 13px;
              color: #666;
              border-top: 1px solid #eee;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🔑</div>
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello ${username}! 👋</div>
              <div class="message">
                We received a request to reset your password for your <strong>netcify</strong> account.
                <br><br>
                Click the button below to create a new password:
              </div>
              <div class="button-container">
                <a href="${resetLink}" class="reset-button">🔑 Reset Password</a>
              </div>
              <div class="or-text">Or copy and paste this link into your browser:</div>
              <div class="link-box">${resetLink}</div>
              <div class="warning">
                <span class="warning-icon">⏰</span>
                <strong>Important:</strong> This password reset link will expire in <strong>1 hour</strong>. 
                If it expires, you'll need to request a new password reset.
              </div>
              <div class="security-notice">
                <span class="warning-icon">🔒</span>
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. 
                Your account is still secure, and your current password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>
                This email was sent by <strong>netcify</strong><br>
                Need help? Contact us at <a href="mailto:${SMTP_USER}">${SMTP_USER}</a>
              </p>
              <p style="margin-top: 20px; color: #999; font-size: 11px;">
                © 2025 netcify. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${username}!

We received a request to reset your password for your netcify account.

To reset your password, please click the link below:

${resetLink}

⏰ Important: This password reset link will expire in 1 hour.

🔒 Security Notice: If you didn't request a password reset, please ignore this email. Your account is still secure.

---
Need help? Contact us at ${SMTP_USER}
© 2025 netcify. All rights reserved.
      `
    };

    // Send email
    debugLog('📤 Sending Password Reset Email');
    const info = await transporter.sendMail(mailOptions);

    debugLog('✅ Email Sent Successfully', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Password reset email sent successfully',
        messageId: info.messageId,
        resetLink: resetLink
      })
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    // Return the link even on error
    const resetLink = `${FRONTEND_URL}/reset-password?token=${JSON.parse(event.body).resetToken}`;
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to send password reset email',
        error: error.message,
        resetLink: resetLink,
        note: 'Email could not be sent, but you can copy the link above to send manually.'
      })
    };
  }
}
