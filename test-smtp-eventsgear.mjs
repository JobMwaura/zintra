#!/usr/bin/env node

/**
 * Test Script for EventsGear SMTP Configuration
 * Use this to verify SMTP settings before configuring in Supabase
 */

import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: 'mail.eventsgear.co.ke',
  port: 587, // TLS port (recommended for Supabase)
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'forgetpassword@eventsgear.co.ke',
    pass: process.env.EMAIL_PASSWORD || 'YOUR_EMAIL_PASSWORD_HERE'
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates if needed
  }
};

async function testSMTPConnection() {
  console.log('🧪 Testing EventsGear SMTP Configuration...\n');

  // Create transporter
  const transporter = nodemailer.createTransporter(SMTP_CONFIG);

  try {
    // Test connection
    console.log('📡 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = {
      from: 'Zintra <forgetpassword@eventsgear.co.ke>',
      to: process.env.TEST_EMAIL || 'your-test-email@example.com',
      subject: 'Zintra Password Reset Test',
      text: 'This is a test email from your EventsGear SMTP configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea8f1e;">Password Reset Test</h2>
          <p>This is a test email to verify your EventsGear SMTP configuration.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: mail.eventsgear.co.ke</li>
            <li>SMTP Port: 587 (TLS)</li>
            <li>Sender: forgetpassword@eventsgear.co.ke</li>
          </ul>
          <p style="color: #666;">If you received this email, your SMTP configuration is working correctly!</p>
        </div>
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your inbox (and spam folder)\n');

    // Summary
    console.log('📋 SMTP Configuration Summary:');
    console.log('==============================');
    console.log(`Host: ${SMTP_CONFIG.host}`);
    console.log(`Port: ${SMTP_CONFIG.port} (TLS)`);
    console.log(`Username: ${SMTP_CONFIG.auth.user}`);
    console.log(`Sender Email: forgetpassword@eventsgear.co.ke`);
    console.log(`Sender Name: Zintra\n`);

    console.log('🔧 Supabase Configuration:');
    console.log('===========================');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your Zintra project');
    console.log('3. Settings → Authentication → Email');
    console.log('4. Enable "Custom SMTP Server"');
    console.log('5. Enter the configuration above');
    console.log('6. Save and test with Supabase test email\n');

    console.log('✅ Your EventsGear SMTP is ready for Supabase!');

  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('==================');
    console.log('• Verify the email password is correct');
    console.log('• Check if SMTP is enabled for your email account');
    console.log('• Try port 465 with secure: true if 587 fails');
    console.log('• Contact EventsGear support if connection fails');
    console.log('• Make sure firewall allows outbound SMTP connections');
  }
}

// Check environment variables
if (!process.env.EMAIL_PASSWORD) {
  console.log('⚠️  EMAIL_PASSWORD environment variable not set');
  console.log('💡 Usage: EMAIL_PASSWORD=your_password TEST_EMAIL=test@example.com node test-smtp.mjs');
  console.log('');
}

if (!process.env.TEST_EMAIL) {
  console.log('⚠️  TEST_EMAIL environment variable not set');
  console.log('💡 Usage: EMAIL_PASSWORD=your_password TEST_EMAIL=test@example.com node test-smtp.mjs');
  console.log('');
}

// Run the test
testSMTPConnection().catch(console.error);