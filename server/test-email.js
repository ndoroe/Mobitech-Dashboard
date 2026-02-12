require('dotenv').config();
const { sendEmail } = require('./src/utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log(`Sending from: ${process.env.EMAIL_FROM}`);
    console.log(`Using SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    
    const result = await sendEmail({
      to: 'edron24@gmail.com',
      subject: 'SIM Dashboard - Email Test',
      text: 'This is a test email from your SIM Dashboard application. Email service is working correctly!',
      html: '<h1>Email Test Successful</h1><p>This is a test email from your SIM Dashboard application.</p><p>Email service is working correctly!</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
}

testEmail();
