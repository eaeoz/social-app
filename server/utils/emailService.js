import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Read environment variables INSIDE the function (lazy loading)
    // This ensures they're read AFTER dotenv.config() has run
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
    const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    
    console.log('📧 Initializing email transporter...');
    console.log(`📧 SMTP_USER: ${SMTP_USER ? '✅ Set' : '❌ Not set'}`);
    console.log(`📧 SMTP_PASS: ${SMTP_PASS ? '✅ Set (length: ' + SMTP_PASS.length + ')' : '❌ Not set'}`);
    console.log(`📧 SMTP_HOST: ${SMTP_HOST}`);
    console.log(`📧 SMTP_PORT: ${SMTP_PORT}`);
    console.log(`📧 Frontend URL: ${FRONTEND_URL}`);
    
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('❌ SMTP credentials not configured - emails will NOT be sent!');
      console.error('❌ Please set SMTP_USER and SMTP_PASS environment variables');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true // Log information
    });

    console.log(`✅ Email transporter initialized: ${SMTP_HOST}:${SMTP_PORT}`);
    
    // Store SMTP config in transporter for later use
    transporter.smtpConfig = { SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT, FRONTEND_URL };
  }

  return transporter;
}

/**
 * Send email verification email
 * @param {string} email - Recipient email
 * @param {string} username - User's username
 * @param {string} verificationToken - Verification token
 * @returns {Promise<object>} Result object with success status
 */
export async function sendVerificationEmail(email, username, verificationToken) {
  try {
    const mailer = getTransporter();
    
    if (!mailer) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    // Verify transporter
    await mailer.verify();
    console.log('✅ SMTP connection verified');

    // Get SMTP config from transporter
    const { SMTP_USER, FRONTEND_URL } = mailer.smtpConfig;
    
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
            .footer {
              background: #f9f9f9;
              padding: 30px;
              text-align: center;
              font-size: 13px;
              color: #666;
              border-top: 1px solid #eee;
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
                <strong>⏰ Important:</strong> This verification link will expire in <strong>24 hours</strong>. 
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
    console.log(`📤 Sending verification email to: ${email}`);
    const info = await mailer.sendMail(mailOptions);

    console.log(`✅ Verification email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Verification email sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('Error details:', error.message);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to send verification email'
    };
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} username - User's username
 * @param {string} resetToken - Password reset token
 * @returns {Promise<object>} Result object with success status
 */
export async function sendPasswordResetEmail(email, username, resetToken) {
  try {
    const mailer = getTransporter();
    
    if (!mailer) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    // Verify transporter
    await mailer.verify();

    // Get SMTP config from transporter
    const { SMTP_USER, FRONTEND_URL } = mailer.smtpConfig;

    // Create reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: `"netcify" <${SMTP_USER}>`,
      to: email,
      subject: '🔐 Password Reset Request - netcify',
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
              background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
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
              color: #ff6b6b;
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
              background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 50px;
              font-size: 18px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
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
              border-left: 3px solid #ff6b6b;
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
            .footer {
              background: #f9f9f9;
              padding: 30px;
              text-align: center;
              font-size: 13px;
              color: #666;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🔐</div>
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello ${username}! 👋</div>
              <div class="message">
                We received a request to reset your password for your <strong>netcify</strong> account.
                <br><br>
                Click the button below to reset your password:
              </div>
              <div class="button-container">
                <a href="${resetLink}" class="reset-button">🔐 Reset Password</a>
              </div>
              <div class="or-text">Or copy and paste this link into your browser:</div>
              <div class="link-box">${resetLink}</div>
              <div class="warning">
                <strong>⏰ Important:</strong> This reset link will expire in <strong>1 hour</strong>.
              </div>
              <div class="message">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
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

Click the link below to reset your password:

${resetLink}

⏰ Important: This reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

---
Need help? Contact us at ${SMTP_USER}
© 2025 netcify. All rights reserved.
      `
    };

    // Send email
    console.log(`📤 Sending password reset email to: ${email}`);
    const info = await mailer.sendMail(mailOptions);

    console.log(`✅ Password reset email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Password reset email sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('Error details:', error.message);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to send password reset email'
    };
  }
}
