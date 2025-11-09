import nodemailer from 'nodemailer';

// SMTP credentials from Netlify environment variables
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');

// Frontend URL for verification link
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

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
  debugLog('🚀 Verify Email Function Invoked', {
    httpMethod: event.httpMethod,
    hasBody: !!event.body
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
    const { email, username, verificationToken } = JSON.parse(event.body);

    debugLog('📝 Request Data', { email, username, hasToken: !!verificationToken });

    // Validate inputs
    if (!email || !username || !verificationToken) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email, username, and verification token are required'
        })
      };
    }

    // Validate SMTP configuration
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('❌ Missing SMTP credentials');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email service not configured'
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

    // Create verification link
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Email content
    const mailOptions = {
      from: `"netcify" <${SMTP_USER}>`,
      to: email,
      subject: '✅ Verify Your Email - netcify',
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
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 50px;
              font-size: 18px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: transform 0.2s;
            }
            .verify-button:hover {
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
              <div class="icon">📧</div>
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello ${username}! 👋</div>
              <div class="message">
                Thank you for signing up for <strong>netcify</strong>! We're excited to have you join our community.
                <br><br>
                To complete your registration and start using your account, please verify your email address by clicking the button below:
              </div>
              <div class="button-container">
                <a href="${verificationLink}" class="verify-button">✅ Verify Email Address</a>
              </div>
              <div class="or-text">Or copy and paste this link into your browser:</div>
              <div class="link-box">${verificationLink}</div>
              <div class="warning">
                <span class="warning-icon">⏰</span>
                <strong>Important:</strong> This verification link will expire in <strong>24 hours</strong>. 
                If it expires, you'll need to register again or request a new verification email.
              </div>
              <div class="message">
                If you didn't create an account on netcify, you can safely ignore this email.
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

Thank you for signing up for netcify!

To complete your registration and verify your email address, please click the link below:

${verificationLink}

⏰ Important: This verification link will expire in 24 hours.

If you didn't create an account on netcify, you can safely ignore this email.

---
Need help? Contact us at ${SMTP_USER}
© 2025 netcify. All rights reserved.
      `
    };

    // Send email
    debugLog('📤 Sending Verification Email');
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
        message: 'Verification email sent successfully',
        messageId: info.messageId
      })
    };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to send verification email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}
