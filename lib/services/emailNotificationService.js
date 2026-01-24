/**
 * Email Notification Service
 * Sends transactional emails via EventsGear SMTP
 */

import nodemailer from 'nodemailer';

// Create transporter (lazy initialization)
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'mail.eventsgear.co.ke',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: 'noreply@eventsgear.co.ke',
        pass: process.env.EVENTSGEAR_EMAIL_PASSWORD
      }
    });
  }
  return transporter;
}

/**
 * Send notification to buyer when vendor sends them a message
 */
export async function notifyBuyerOfNewMessage({ 
  buyerEmail, 
  buyerName, 
  vendorName, 
  messagePreview 
}) {
  const transport = getTransporter();
  
  const truncatedMessage = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + '...' 
    : messagePreview;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">New Message on Zintra</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333;">Hi ${buyerName || 'there'},</p>
      
      <p style="font-size: 16px; color: #333;">
        You have a new message from <strong>${vendorName}</strong> on Zintra.
      </p>
      
      <!-- Message Preview -->
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px 20px; margin: 20px 0;">
        <p style="margin: 0; color: #555; font-style: italic;">"${truncatedMessage}"</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://zintra.vercel.app/messages" 
           style="display: inline-block; background: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          View Message
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        Log in to your Zintra account to reply and continue the conversation.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated notification from Zintra. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Zintra. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
Hi ${buyerName || 'there'},

You have a new message from ${vendorName} on Zintra.

"${truncatedMessage}"

Log in to view and reply: https://zintra.vercel.app/messages

This is an automated notification from Zintra.
`;

  try {
    const result = await transport.sendMail({
      from: '"Zintra" <noreply@eventsgear.co.ke>',
      to: buyerEmail,
      subject: `New message from ${vendorName} on Zintra`,
      text: textContent,
      html: htmlContent
    });

    console.log('[Email] ✅ Notification sent to buyer:', buyerEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email] ❌ Failed to send notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to vendor when buyer sends them a message
 */
export async function notifyVendorOfNewMessage({ 
  vendorEmail, 
  vendorName, 
  buyerName, 
  messagePreview 
}) {
  const transport = getTransporter();
  
  const truncatedMessage = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + '...' 
    : messagePreview;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">New Message on Zintra</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333;">Hi ${vendorName || 'there'},</p>
      
      <p style="font-size: 16px; color: #333;">
        You have a new message from <strong>${buyerName}</strong> on Zintra.
      </p>
      
      <!-- Message Preview -->
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px 20px; margin: 20px 0;">
        <p style="margin: 0; color: #555; font-style: italic;">"${truncatedMessage}"</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://zintra.vercel.app/vendor/profile" 
           style="display: inline-block; background: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          View Message
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        Log in to your Zintra vendor account to reply and continue the conversation.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated notification from Zintra. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Zintra. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
Hi ${vendorName || 'there'},

You have a new message from ${buyerName} on Zintra.

"${truncatedMessage}"

Log in to view and reply: https://zintra.vercel.app/vendor/profile

This is an automated notification from Zintra.
`;

  try {
    const result = await transport.sendMail({
      from: '"Zintra" <noreply@eventsgear.co.ke>',
      to: vendorEmail,
      subject: `New message from ${buyerName} on Zintra`,
      text: textContent,
      html: htmlContent
    });

    console.log('[Email] ✅ Notification sent to vendor:', vendorEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email] ❌ Failed to send notification:', error);
    return { success: false, error: error.message };
  }
}

export default {
  notifyBuyerOfNewMessage,
  notifyVendorOfNewMessage
};
