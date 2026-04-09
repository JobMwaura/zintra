import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check if environment variables are loaded
  const hasEmailPassword = !!process.env.EVENTSGEAR_EMAIL_PASSWORD;
  const passwordValue = process.env.EVENTSGEAR_EMAIL_PASSWORD;
  
  return NextResponse.json({
    hasEmailPassword,
    passwordSet: passwordValue !== undefined && passwordValue !== 'YOUR_EMAIL_PASSWORD_HERE',
    passwordLength: passwordValue ? passwordValue.length : 0,
    // Don't expose the actual password for security
    passwordPreview: passwordValue ? `${passwordValue.substring(0, 3)}***` : 'not set',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('EVENTSGEAR')),
    timestamp: new Date().toISOString()
  });
}