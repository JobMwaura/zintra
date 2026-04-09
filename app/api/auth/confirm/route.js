// File: app/api/auth/confirm/route.js
// Purpose: Server-side token verification for password reset
// This is the recommended Supabase pattern for secure password reset

import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL(request.url);
  const code =
    url.searchParams.get('code') ||
    url.searchParams.get('token') ||
    url.searchParams.get('token_hash') ||
    url.searchParams.get('oob') ||
    url.searchParams.get('t');
  const type = url.searchParams.get('type') || 'recovery'; // default to recovery

  const origin = url.origin;

  if (!code) {
    // missing token — redirect to reset page with error
    console.error('❌ No token found in confirm request');
    return NextResponse.redirect(new URL('/auth/reset?error=no_token', origin));
  }

  // Build verify URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return NextResponse.redirect(new URL('/auth/reset?error=server_config', origin));
  }

  const verifyUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(code)}`;

  try {
    console.log('🔐 Verifying token with Supabase:', { type, tokenLength: code.length });
    
    const res = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('⚠️ Supabase verify responded with non-OK status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      
      // Redirect to reset with an indicator so UI can show a helpful message
      return NextResponse.redirect(new URL('/auth/reset?error=invalid_token', origin));
    }

    const data = await res.json();
    console.log('✅ Token verified successfully');

    // On success, redirect user to the change-password page.
    // Keep the original code in the query so the client can use it if necessary.
    const redirectUrl = new URL('/auth/change-password', origin);
    redirectUrl.searchParams.set('token', code);
    redirectUrl.searchParams.set('type', type);

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error('❌ Error verifying token with Supabase:', err);
    return NextResponse.redirect(new URL('/auth/reset?error=server_error', origin));
  }
}
