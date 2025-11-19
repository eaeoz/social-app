import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name, email, subject, message, recaptchaToken } = JSON.parse(event.body || '{}');

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
      
      if (recaptchaSecretKey) {
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${recaptchaSecretKey}&response=${recaptchaToken}`
        });

        const recaptchaData = await recaptchaResponse.json();

        // Check if reCAPTCHA verification failed or score is too low
        if (!recaptchaData.success || (recaptchaData.score && recaptchaData.score < 0.5)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'reCAPTCHA verification failed. Please try again.' 
            })
          };
        }
      }
    }

    // Validate input
    if (!name || !email || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'All fields are required' })
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_TO_EMAIL,
      subject: `Blog Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Message sent successfully!' 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send message. Please try again later.' 
      })
    };
  }
};
