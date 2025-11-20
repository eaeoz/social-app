// Simple SMTP test script
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');

console.log('🧪 Testing SMTP Configuration...\n');
console.log(`📧 SMTP_HOST: ${SMTP_HOST}`);
console.log(`📧 SMTP_PORT: ${SMTP_PORT}`);
console.log(`📧 SMTP_USER: ${SMTP_USER ? '✅ Set' : '❌ Not set'}`);
console.log(`📧 SMTP_PASS: ${SMTP_PASS ? '✅ Set (length: ' + SMTP_PASS.length + ')' : '❌ Not set'}`);
console.log('');

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP credentials not configured!');
  console.error('Please set SMTP_USER and SMTP_PASS in server/.env');
  process.exit(1);
}

// Create transporter
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
  },
  debug: true,
  logger: true
});

async function testSMTP() {
  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"netcify Test" <${SMTP_USER}>`,
      to: process.env.SMTP_TO_EMAIL || SMTP_USER,
      subject: '✅ SMTP Test - netcify',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 SMTP Configuration Working!</h2>
          <p>This is a test email from your netcify application.</p>
          <p><strong>SMTP Host:</strong> ${SMTP_HOST}</p>
          <p><strong>SMTP Port:</strong> ${SMTP_PORT}</p>
          <p><strong>Sent At:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
      text: `SMTP Configuration Working! This is a test email from netcify. Host: ${SMTP_HOST}, Port: ${SMTP_PORT}`
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Recipient: ${process.env.SMTP_TO_EMAIL || SMTP_USER}`);
    console.log('\n🎊 SMTP is configured correctly and working!');
    
  } catch (error) {
    console.error('\n❌ SMTP Test Failed!');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Wrong SMTP credentials (username/password)');
    console.error('2. SMTP server blocking the connection');
    console.error('3. Need to use App Password instead of regular password');
    console.error('4. Firewall blocking SMTP port');
    process.exit(1);
  }
}

testSMTP();
