import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import fetch from 'node-fetch';
import { getDatabase } from '../config/database.js';

/**
 * Send password recovery email to user
 */
export async function sendPasswordRecoveryEmail(email, username, recoveryToken) {
  try {
    const db = getDatabase();
    const siteSettings = await db.collection('siteSettings').findOne({});

    const FRONTEND_URL = (siteSettings && siteSettings.frontendUrl) || process.env.CLIENT_URL || 'http://localhost:5173';
    const recoveryLink = `${FRONTEND_URL}/reset-password?token=${recoveryToken}`;
    const method = process.env.MAIL_SEND_METHOD || 'smtp';

    console.log(`📤 Sending password recovery email to: ${email} (method: ${method})`);

    if (method === 'resend') {
      return await sendViaResend(email, username, recoveryLink);
    }

    if (method === 'brevo') {
      return await sendViaBrevo(email, username, recoveryLink);
    }

    // Netlify function path
    const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL;
    if (NETLIFY_FUNCTION_URL) {
      try {
        console.log('🚀 Attempting to send password reset email via Netlify function...');
        const response = await fetch(`${NETLIFY_FUNCTION_URL}/.netlify/functions/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, resetToken: recoveryToken })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('✅ Password reset email sent via Netlify function');
          return { success: true, messageId: data.messageId, method: 'netlify' };
        }
        console.warn('⚠️ Netlify function failed, falling back to direct SMTP');
      } catch (netlifyError) {
        console.warn('⚠️ Netlify function error, falling back to direct SMTP:', netlifyError.message);
      }
    }

    // SMTP path
    let SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT;

    if (siteSettings && siteSettings.smtp) {
      SMTP_USER = siteSettings.smtp.user;
      SMTP_PASS = siteSettings.smtp.pass;
      SMTP_HOST = siteSettings.smtp.host || 'smtp.yandex.com';
      SMTP_PORT = parseInt(siteSettings.smtp.port || '587');
      console.log('✅ Using SMTP settings from database');
    } else {
      SMTP_USER = process.env.SMTP_USER;
      SMTP_PASS = process.env.SMTP_PASS;
      SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
      SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
      console.log('⚠️ Using SMTP settings from environment variables');
    }

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('❌ Missing SMTP credentials and Netlify function unavailable');
      return {
        success: false,
        error: 'Email service not configured',
        recoveryLink,
        message: 'SMTP not configured. Please configure SMTP settings in admin panel or send the link manually.'
      };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();
    console.log('✅ Email transporter verified');

    const info = await transporter.sendMail({
      from: `"netcify" <${SMTP_USER}>`,
      to: email,
      subject: '🔐 Reset Your Password - netcify',
      html: getPasswordResetHtml(recoveryLink, username, email),
      text: getPasswordResetText(recoveryLink, username, email)
    });

    console.log(`✅ Password recovery email sent to: ${email} (via direct SMTP)`);
    console.log(`   Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, method: 'smtp' };

  } catch (error) {
    console.error('❌ Error sending password recovery email:', error);
    throw error;
  }
}

async function sendViaResend(email, username, recoveryLink) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Resend not configured. Set RESEND_API_KEY.');

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const info = await resend.emails.send({
    from,
    to: email,
    subject: '🔐 Reset Your Password - netcify',
    html: getPasswordResetHtml(recoveryLink, username, email),
    text: getPasswordResetText(recoveryLink, username, email)
  });

  console.log(`✅ Password recovery email sent via Resend to: ${email}`);
  console.log(`📧 Message ID: ${info.data?.id || info.id}`);
  return { success: true, messageId: info.data?.id || info.id, method: 'resend' };
}

async function sendViaBrevo(email, username, recoveryLink) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) throw new Error('Brevo not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: { email: senderEmail, name: 'netcify' },
      to: [{ email }],
      subject: '🔐 Reset Your Password - netcify',
      htmlContent: getPasswordResetHtml(recoveryLink, username, email),
      textContent: getPasswordResetText(recoveryLink, username, email)
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Brevo API error: ${response.status}`);

  console.log(`✅ Password recovery email sent via Brevo to: ${email}`);
  console.log(`📧 Message ID: ${data.messageId}`);
  return { success: true, messageId: data.messageId, method: 'brevo' };
}

function getPasswordResetHtml(recoveryLink, username, contactEmail) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5; }
        .container { background: white; margin: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header .icon { font-size: 60px; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 20px; }
        .message { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 30px; }
        .button-container { text-align: center; margin: 40px 0; }
        .recovery-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s; }
        .recovery-button:hover { transform: translateY(-2px); }
        .or-text { text-align: center; color: #999; margin: 20px 0; font-size: 14px; }
        .link-box { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea; word-wrap: break-word; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 5px; }
        .security-note { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 30px 0; border-radius: 5px; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; font-size: 13px; color: #666; border-top: 1px solid #eee; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🔐</div>
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${username}! 👋</div>
          <div class="message">
            We received a request to reset the password for your <strong>netcify</strong> account.
            <br><br>
            If you made this request, click the button below to reset your password:
          </div>
          <div class="button-container">
            <a href="${recoveryLink}" class="recovery-button">🔐 Reset Password</a>
          </div>
          <div class="or-text">Or copy and paste this link into your browser:</div>
          <div class="link-box">${recoveryLink}</div>
          <div class="warning">
            <strong>⏰ Important:</strong> This password reset link will expire in <strong>1 hour</strong>. 
            If it expires, you'll need to request a new password reset link.
          </div>
          <div class="security-note">
            <strong>🛡️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. 
            Your account is secure and your password has not been changed.
          </div>
        </div>
        <div class="footer">
          <p>
            This email was sent by <strong>netcify</strong><br>
            Need help? Contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>
          </p>
          <p style="margin-top: 20px; color: #999; font-size: 11px;">
            © 2025 netcify. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getPasswordResetText(recoveryLink, username, contactEmail) {
  return `
Hello ${username}!

We received a request to reset the password for your netcify account.

If you made this request, click the link below to reset your password:

${recoveryLink}

⏰ Important: This password reset link will expire in 1 hour.

🛡️ Security Notice: If you didn't request a password reset, please ignore this email. Your account is secure and your password has not been changed.

---
Need help? Contact us at ${contactEmail}
© 2025 netcify. All rights reserved.
  `;
}
