import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

let transporter;

function getTransporter() {
  if (!process.env.EVENTSGEAR_EMAIL_PASSWORD) {
    throw new Error('Email transport is not configured');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'mail.eventsgear.co.ke',
      port: 587,
      secure: false,
      auth: {
        user: 'noreply@eventsgear.co.ke',
        pass: process.env.EVENTSGEAR_EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

function getSiteUrl(request) {
  const requestOrigin = request.headers.get('origin');
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return (configuredUrl || requestOrigin || 'https://zintraconstruction.com').replace(/\/$/, '');
}

function buildRecoveryUrl(siteUrl, hashedToken) {
  const recoveryUrl = new URL('/auth/confirm', siteUrl);
  recoveryUrl.searchParams.set('token_hash', hashedToken);
  recoveryUrl.searchParams.set('type', 'recovery');
  return recoveryUrl.toString();
}

function looksLikeUnknownUser(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('user not found')
    || message.includes('email not found')
    || message.includes('user does not exist')
    || message.includes('email address not authorized');
}

function buildEmailContent(recoveryUrl) {
  return {
    subject: 'Reset your Zintra password',
    text: [
      'We received a request to reset your Zintra password.',
      '',
      'Open this link to choose a new password:',
      recoveryUrl,
      '',
      'This link expires in 1 hour. If you did not request this reset, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h1 style="margin: 0 0 12px; font-size: 24px; color: #111827;">Reset your Zintra password</h1>
          <p style="margin: 0 0 16px; line-height: 1.6;">We received a request to reset your Zintra password.</p>
          <p style="margin: 0 0 24px; line-height: 1.6;">Use the button below to choose a new password. This link expires in 1 hour.</p>
          <p style="margin: 0 0 24px; text-align: center;">
            <a href="${recoveryUrl}" style="display: inline-block; background: #f97316; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600;">Reset Password</a>
          </p>
          <p style="margin: 0 0 8px; line-height: 1.6;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="margin: 0 0 24px; word-break: break-all;"><a href="${recoveryUrl}" style="color: #ea580c;">${recoveryUrl}</a></p>
          <p style="margin: 0; color: #6b7280; line-height: 1.6;">If you did not request this reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) {
      if (looksLikeUnknownUser(error)) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      throw error;
    }

    const hashedToken = data?.properties?.hashed_token;
    if (!hashedToken) {
      throw new Error('Failed to generate recovery token');
    }

    const siteUrl = getSiteUrl(request);
    const recoveryUrl = buildRecoveryUrl(siteUrl, hashedToken);
    const emailContent = buildEmailContent(recoveryUrl);

    await getTransporter().sendMail({
      from: 'Zintra <noreply@eventsgear.co.ke>',
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[auth/forgot-password] Failed to send password reset email:', error);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}