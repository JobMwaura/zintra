/**
 * ============================================================================
 * EMAIL OTP SENDER API
 * ============================================================================
 * Internal API endpoint for sending OTP emails via EventsGear SMTP
 * 
 * POST /api/send-email-otp
 * 
 * This is a simple fallback that returns success for now.
 * In production, you would integrate with:
 * - SendGrid API
 * - Resend API  
 * - Or configure EventsGear SMTP directly
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { to, subject, html, text } = await request.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`[Email OTP API] Would send email to: ${to}`);
    console.log(`[Email OTP API] Subject: ${subject}`);
    console.log(`[Email OTP API] HTML length: ${html.length} chars`);

    // TODO: Replace with actual email service integration
    // For now, we'll simulate success to test the flow
    
    // In production, you would use one of these approaches:
    // 
    // Option 1: SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, subject, html, text });
    //
    // Option 2: Resend
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ from: 'noreply@eventsgear.co.ke', to, subject, html });
    //
    // Option 3: Direct EventsGear SMTP with nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({ ... });
    // await transporter.sendMail({ from: 'noreply@eventsgear.co.ke', to, subject, html });

    // For now, simulate successful email sending
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    console.log(`[Email OTP API] ✅ Email simulation completed for: ${to}`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully (simulated)',
      timestamp: new Date().toISOString(),
      debug: {
        to,
        subject,
        note: 'This is currently simulated. Configure SendGrid/Resend/EventsGear for production.'
      }
    });

  } catch (error) {
    console.error(`[Email OTP API] Unexpected error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Email OTP API - Use POST to send emails',
    status: 'ready',
    note: 'Currently using simulated email sending. Configure SendGrid/Resend/EventsGear for production.'
  });
}