import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test SMTP configuration
 */
async function testSMTP() {
  try {
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');

    console.log('📧 Testing SMTP Configuration...');
    console.log(`   Host: ${SMTP_HOST}`);
    console.log(`   Port: ${SMTP_PORT}`);
    console.log(`   User: ${SMTP_USER}`);
    console.log('');

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('❌ SMTP credentials not found in .env file');
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
      }
    });

    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');
    console.log('✅ Your SMTP configuration is working correctly!');
    console.log('   You can now send emails through the contact form.');

  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('  1. Incorrect SMTP credentials');
    console.error('  2. Less secure app access not enabled (if using Gmail)');
    console.error('  3. Firewall blocking SMTP port');
    console.error('  4. SMTP server address or port incorrect');
    process.exit(1);
  }
}

testSMTP()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
