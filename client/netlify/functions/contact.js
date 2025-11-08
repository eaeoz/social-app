import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

// MongoDB connection details - these should be in Netlify environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'social-app';

// Debug logging helper
function debugLog(stage, data) {
  console.log('=====================================');
  console.log(`[DEBUG] ${stage}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('=====================================');
}

// Error logging helper
function errorLog(stage, error) {
  console.error('=====================================');
  console.error(`[ERROR] ${stage}`);
  console.error('Timestamp:', new Date().toISOString());
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  console.error('Error Code:', error.code);
  console.error('=====================================');
}

// Connect to MongoDB and fetch site settings
async function getSiteSettingsFromDB() {
  debugLog('MongoDB Connection Start', {
    uri: MONGODB_URI ? 'Set (hidden for security)' : 'NOT SET',
    dbName: MONGODB_DB_NAME
  });

  let client;
  try {
    // MongoDB connection options
    const options = {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    debugLog('Connecting to MongoDB', {
      dbName: MONGODB_DB_NAME,
      options: Object.keys(options)
    });

    client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    debugLog('MongoDB Connection Success', {
      status: 'Connected',
      dbName: MONGODB_DB_NAME
    });

    const db = client.db(MONGODB_DB_NAME);
    
    // Test the connection
    await db.command({ ping: 1 });
    debugLog('MongoDB Ping Success', { status: 'Database is responsive' });

    // Fetch site settings from sitesettings collection
    const settingsCollection = db.collection('sitesettings');
    
    debugLog('Querying siteSettings Collection', {
      collection: 'sitesettings',
      query: { settingType: 'global' }
    });

    const settings = await settingsCollection.findOne({ settingType: 'global' });

    if (!settings) {
      errorLog('Site Settings Not Found', new Error('No global settings found in database'));
      throw new Error('Site settings not configured in database');
    }

    debugLog('Site Settings Retrieved', {
      hasSmtpUser: !!settings.smtpUser,
      hasSmtpPass: !!settings.smtpPass,
      hasSmtpHost: !!settings.smtpHost,
      smtpPort: settings.smtpPort,
      hasSiteEmail: !!settings.siteEmail,
      hasRecipientEmail: !!settings.recipientEmail,
      showuserlistpicture: settings.showuserlistpicture,
      searchUserCount: settings.searchUserCount,
      defaultUsersDisplayCount: settings.defaultUsersDisplayCount
    });

    await client.close();
    debugLog('MongoDB Connection Closed', { status: 'Connection closed successfully' });

    return {
      smtpUser: settings.smtpUser,
      smtpPass: settings.smtpPass,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      siteEmail: settings.siteEmail,
      recipientEmail: settings.recipientEmail
    };

  } catch (error) {
    errorLog('MongoDB Operation Failed', error);
    if (client) {
      await client.close();
      debugLog('MongoDB Connection Closed After Error', { status: 'Closed' });
    }
    throw error;
  }
}

// Create nodemailer transporter with settings from database
async function createEmailTransporter(settings) {
  debugLog('Creating Email Transporter', {
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    user: settings.smtpUser
  });

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter configuration
  try {
    debugLog('Verifying Email Transporter', { status: 'Starting verification' });
    await transporter.verify();
    debugLog('Email Transporter Verified', { status: 'Verification successful' });
  } catch (error) {
    errorLog('Email Transporter Verification Failed', error);
    throw error;
  }

  return transporter;
}

// Netlify serverless function handler
export async function handler(event, context) {
  debugLog('Netlify Function Invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters
  });

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    debugLog('CORS Preflight Request', { method: 'OPTIONS' });
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    debugLog('Invalid HTTP Method', { method: event.httpMethod });
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
    debugLog('Parsing Request Body', { rawBody: event.body });
    const { username, email, subject, message } = JSON.parse(event.body);

    debugLog('Request Body Parsed', {
      username,
      email,
      subject,
      messageLength: message?.length
    });

    // Validate request body
    if (!username || !email || !subject || !message) {
      debugLog('Validation Failed - Missing Fields', {
        hasUsername: !!username,
        hasEmail: !!email,
        hasSubject: !!subject,
        hasMessage: !!message
      });
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required'
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      debugLog('Validation Failed - Invalid Email Format', { email });
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid email format'
        })
      };
    }

    debugLog('Validation Passed', { status: 'All fields valid' });

    // Get site settings from MongoDB
    debugLog('Fetching Site Settings', { status: 'Starting database query' });
    const settings = await getSiteSettingsFromDB();

    // Validate SMTP settings
    if (!settings.smtpUser || !settings.smtpPass || !settings.smtpHost) {
      errorLog('SMTP Configuration Invalid', new Error('Missing SMTP credentials in database'));
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email service is not configured properly'
        })
      };
    }

    // Determine recipient email (use recipientEmail if available, otherwise siteEmail)
    const recipientEmail = settings.recipientEmail || settings.siteEmail;
    
    if (!recipientEmail || recipientEmail.trim() === '') {
      errorLog('Recipient Email Not Configured', new Error('No recipient email in database'));
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Contact form is not configured. Please contact the administrator.'
        })
      };
    }

    debugLog('Email Recipients Configured', {
      recipientEmail,
      siteEmail: settings.siteEmail
    });

    // Create transporter
    debugLog('Creating Email Transporter', { status: 'Initializing' });
    const transporter = await createEmailTransporter(settings);

    // Email content
    const mailOptions = {
      from: `"${username}" <${settings.smtpUser}>`,
      to: recipientEmail,
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
              <p>This email was sent from your website's contact form via Netlify Function.</p>
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
This email was sent from your website's contact form via Netlify Function.
Reply to: ${email}
      `
    };

    debugLog('Email Content Prepared', {
      from: mailOptions.from,
      to: mailOptions.to,
      replyTo: mailOptions.replyTo,
      subject: mailOptions.subject
    });

    // Send email
    debugLog('Sending Email', { status: 'Starting email transmission' });
    const info = await transporter.sendMail(mailOptions);

    debugLog('Email Sent Successfully', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Message sent successfully! We\'ll get back to you soon.',
        messageId: info.messageId
      })
    };

  } catch (error) {
    errorLog('Function Execution Failed', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to send message. Please try again later.';
    let statusCode = 500;

    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please contact the administrator.';
      debugLog('Email Authentication Error', { code: 'EAUTH' });
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Unable to connect to email server. Please try again later.';
      debugLog('Connection Error', { code: error.code });
    } else if (error.message.includes('Site settings not configured')) {
      errorMessage = 'Email service is not configured. Please contact the administrator.';
      statusCode = 503;
      debugLog('Configuration Error', { message: error.message });
    }

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}
