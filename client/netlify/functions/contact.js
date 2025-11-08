import nodemailer from 'nodemailer';

// SMTP credentials from Netlify environment variables
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

// Enhanced debug logging helper with more details
function debugLog(stage, data) {
  const timestamp = new Date().toISOString();
  const separator = '='.repeat(80);
  console.log(separator);
  console.log(`[DEBUG] ${stage}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Stage ID: ${Date.now()}`);
  if (data && typeof data === 'object') {
    console.log('Details:');
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object') {
        console.log(`  ${key}:`, JSON.stringify(value, null, 4));
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  } else {
    console.log('Data:', data);
  }
  console.log(separator);
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

// Netlify serverless function handler
export async function handler(event, context) {
  const functionStartTime = Date.now();
  
  debugLog('🚀 FUNCTION START - Netlify Function Invoked', {
    functionStartTime,
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
    headers: {
      origin: event.headers?.origin,
      referer: event.headers?.referer,
      userAgent: event.headers?.['user-agent'],
      contentType: event.headers?.['content-type']
    },
    netlifyContext: {
      functionName: context.functionName,
      requestId: context.awsRequestId
    },
    environmentVariables: {
      nodeEnv: process.env.NODE_ENV,
      hasSmtpUser: !!SMTP_USER,
      smtpUserLength: SMTP_USER?.length || 0,
      hasSmtpPass: !!SMTP_PASS,
      smtpPassLength: SMTP_PASS?.length || 0,
      smtpHost: SMTP_HOST,
      smtpPort: SMTP_PORT,
      hasRecipientEmail: !!RECIPIENT_EMAIL,
      recipientEmail: RECIPIENT_EMAIL
    }
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
    const parseStartTime = Date.now();
    
    // Parse request body
    debugLog('📝 STEP 1: Parsing Request Body', { 
      hasBody: !!event.body,
      bodyLength: event.body?.length,
      bodyPreview: event.body?.substring(0, 100)
    });
    
    const { username, email, subject, message, recaptchaToken } = JSON.parse(event.body);
    const parseEndTime = Date.now();

    debugLog('✅ STEP 1 COMPLETE: Request Body Parsed Successfully', {
      username,
      email,
      subject,
      messageLength: message?.length,
      messagePreview: message?.substring(0, 50) + '...',
      hasRecaptchaToken: !!recaptchaToken,
      parseTime: `${parseEndTime - parseStartTime}ms`
    });

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const recaptchaStartTime = Date.now();
      debugLog('🔒 STEP 1.5: Verifying reCAPTCHA Token', {
        hasToken: true,
        tokenLength: recaptchaToken.length
      });

      try {
        const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
        
        if (!recaptchaSecretKey) {
          debugLog('⚠️ reCAPTCHA Warning', {
            message: 'reCAPTCHA secret key not configured, skipping verification'
          });
        } else {
          const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${recaptchaSecretKey}&response=${recaptchaToken}`
          });

          const recaptchaResult = await recaptchaResponse.json();
          const recaptchaEndTime = Date.now();

          debugLog('✅ STEP 1.5 COMPLETE: reCAPTCHA Verification Result', {
            success: recaptchaResult.success,
            score: recaptchaResult.score,
            action: recaptchaResult.action,
            challenge_ts: recaptchaResult.challenge_ts,
            hostname: recaptchaResult.hostname,
            errorCodes: recaptchaResult['error-codes'],
            verificationTime: `${recaptchaEndTime - recaptchaStartTime}ms`
          });

          if (!recaptchaResult.success) {
            debugLog('❌ reCAPTCHA Verification Failed', {
              errorCodes: recaptchaResult['error-codes']
            });
            return {
              statusCode: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                success: false,
                message: 'reCAPTCHA verification failed. Please try again.'
              })
            };
          }

          // Check score (v3 typically returns 0.0 to 1.0, with 1.0 being most likely human)
          if (recaptchaResult.score < 0.5) {
            debugLog('⚠️ Low reCAPTCHA Score', {
              score: recaptchaResult.score,
              threshold: 0.5,
              action: 'Rejecting submission'
            });
            return {
              statusCode: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                success: false,
                message: 'Suspicious activity detected. Please try again.'
              })
            };
          }
        }
      } catch (recaptchaError) {
        errorLog('❌ reCAPTCHA Verification Error', recaptchaError);
        // Don't block the submission if reCAPTCHA service is down
        debugLog('⚠️ reCAPTCHA Service Error - Allowing submission', {
          error: recaptchaError.message
        });
      }
    }

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

    const validationEndTime = Date.now();
    debugLog('✅ STEP 2 COMPLETE: Validation Passed', { 
      status: 'All fields valid',
      validationTime: `${validationEndTime - parseEndTime}ms`
    });

    // Validate SMTP configuration
    const configCheckStartTime = Date.now();
    debugLog('🔧 STEP 3: Checking SMTP Configuration', {
      checkingEnvVars: true
    });

    if (!SMTP_USER || !SMTP_PASS || !RECIPIENT_EMAIL) {
      errorLog('❌ SMTP Configuration Invalid', new Error('Missing SMTP environment variables'));
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email service is not configured. Please contact the administrator.'
        })
      };
    }

    const configCheckEndTime = Date.now();
    debugLog('✅ STEP 3 COMPLETE: SMTP Configuration Valid', {
      smtpUser: SMTP_USER,
      smtpHost: SMTP_HOST,
      smtpPort: SMTP_PORT,
      secure: SMTP_PORT === 465,
      recipientEmail: RECIPIENT_EMAIL,
      configCheckTime: `${configCheckEndTime - configCheckStartTime}ms`
    });

    // Create transporter
    const transporterStartTime = Date.now();
    debugLog('📮 STEP 4: Creating Email Transporter', { 
      status: 'Initializing nodemailer transporter',
      config: {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        tlsRejectUnauthorized: false
      }
    });

    const transporter = nodemailer.createTransport({
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

    const transporterEndTime = Date.now();
    debugLog('✅ STEP 4 COMPLETE: Transporter Created', {
      transporterCreationTime: `${transporterEndTime - transporterStartTime}ms`
    });

    // Verify transporter configuration
    const verifyStartTime = Date.now();
    let verifyEndTime;
    try {
      debugLog('🔍 STEP 5: Verifying Email Transporter Connection', { 
        status: 'Testing SMTP server connection',
        testingHost: SMTP_HOST,
        testingPort: SMTP_PORT
      });
      
      await transporter.verify();
      
      verifyEndTime = Date.now();
      debugLog('✅ STEP 5 COMPLETE: Email Transporter Verified Successfully', { 
        status: 'SMTP server connection successful',
        verificationTime: `${verifyEndTime - verifyStartTime}ms`,
        connectionEstablished: true
      });
    } catch (error) {
      verifyEndTime = Date.now();
      errorLog('❌ STEP 5 FAILED: Email Transporter Verification Failed', error);
      debugLog('Verification Attempt Details', {
        attemptDuration: `${verifyEndTime - verifyStartTime}ms`,
        errorType: error.code,
        errorMessage: error.message
      });
      throw error;
    }

    // Email content
    const emailPrepStartTime = Date.now();
    debugLog('📧 STEP 6: Preparing Email Content', {
      preparingFrom: `"${username}" <${SMTP_USER}>`,
      preparingTo: RECIPIENT_EMAIL,
      preparingReplyTo: email,
      preparingSubject: `Contact Form: ${subject}`
    });

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

    const emailPrepEndTime = Date.now();
    debugLog('✅ STEP 6 COMPLETE: Email Content Prepared', {
      from: mailOptions.from,
      to: mailOptions.to,
      replyTo: mailOptions.replyTo,
      subject: mailOptions.subject,
      hasHtmlContent: !!mailOptions.html,
      hasTextContent: !!mailOptions.text,
      htmlLength: mailOptions.html?.length,
      textLength: mailOptions.text?.length,
      emailPrepTime: `${emailPrepEndTime - emailPrepStartTime}ms`
    });

    // Send email
    const sendStartTime = Date.now();
    debugLog('📤 STEP 7: Sending Email via SMTP', { 
      status: 'Initiating email transmission',
      smtpServer: SMTP_HOST,
      smtpPort: SMTP_PORT,
      from: mailOptions.from,
      to: mailOptions.to
    });
    
    const info = await transporter.sendMail(mailOptions);
    
    const sendEndTime = Date.now();
    const functionEndTime = Date.now();
    
    debugLog('✅ STEP 7 COMPLETE: Email Sent Successfully', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope,
      sendTime: `${sendEndTime - sendStartTime}ms`
    });

    debugLog('🎉 FUNCTION COMPLETE - Success', {
      totalExecutionTime: `${functionEndTime - functionStartTime}ms`,
      breakdown: {
        parsing: `${parseEndTime - parseStartTime}ms`,
        validation: `${validationEndTime - parseEndTime}ms`,
        configCheck: `${configCheckEndTime - configCheckStartTime}ms`,
        transporterCreation: `${transporterEndTime - transporterStartTime}ms`,
        transporterVerification: `${verifyEndTime - verifyStartTime}ms`,
        emailPreparation: `${emailPrepEndTime - emailPrepStartTime}ms`,
        emailSending: `${sendEndTime - sendStartTime}ms`
      },
      result: 'SUCCESS',
      messageId: info.messageId
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
    const errorTime = Date.now();
    const errorDuration = errorTime - functionStartTime;
    
    errorLog('❌ FUNCTION FAILED - Exception Caught', error);
    
    debugLog('💥 Error Analysis', {
      errorName: error.name,
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack?.split('\n').slice(0, 5),
      errorTime: new Date().toISOString(),
      timeUntilError: `${errorDuration}ms`
    });

    // Provide more specific error messages
    let errorMessage = 'Failed to send message. Please try again later.';
    let statusCode = 500;
    let errorCategory = 'UNKNOWN';

    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please contact the administrator.';
      errorCategory = 'AUTHENTICATION_ERROR';
      debugLog('🔐 Email Authentication Error Details', { 
        code: 'EAUTH',
        possibleCauses: [
          'Wrong SMTP username or password',
          'Account requires app-specific password',
          'SMTP authentication not enabled'
        ],
        recommendation: 'Check SMTP_USER and SMTP_PASS environment variables'
      });
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Unable to connect to email server. Please try again later.';
      errorCategory = 'CONNECTION_ERROR';
      debugLog('🔌 Connection Error Details', { 
        code: error.code,
        possibleCauses: [
          'SMTP server is down',
          'Wrong SMTP host or port',
          'Network firewall blocking connection',
          'SSL/TLS configuration issue'
        ],
        currentConfig: {
          host: SMTP_HOST,
          port: SMTP_PORT
        },
        recommendation: 'Verify SMTP_HOST and SMTP_PORT are correct'
      });
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address configuration.';
      errorCategory = 'ENVELOPE_ERROR';
      debugLog('📧 Envelope Error Details', {
        code: 'EENVELOPE',
        possibleCauses: [
          'Invalid sender email address',
          'Invalid recipient email address'
        ],
        currentConfig: {
          from: SMTP_USER,
          to: RECIPIENT_EMAIL
        }
      });
    } else if (error.message?.includes('Parse')) {
      errorMessage = 'Invalid request format.';
      errorCategory = 'PARSE_ERROR';
      statusCode = 400;
      debugLog('📝 Parse Error Details', {
        errorMessage: error.message,
        possibleCauses: [
          'Malformed JSON in request body',
          'Missing required fields'
        ]
      });
    }

    debugLog('🔚 FUNCTION END - Failure', {
      totalExecutionTime: `${errorDuration}ms`,
      errorCategory,
      statusCode,
      errorMessage,
      timestamp: new Date().toISOString()
    });

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
