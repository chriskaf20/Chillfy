import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from '@/utils/csrfProtection';

export async function GET(request: NextRequest) {
  try {
    // Generate new CSRF tokens
    const tokens = csrfProtection.generateTokens();
    
    const response = NextResponse.json({
      success: true,
      token: tokens.token,
      expires: tokens.expires
    });

    // Set tokens in cookies
    csrfProtection.setTokenCookies(response, tokens);

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate CSRF token' 
      },
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // For preflight checks - just return the token in headers
  try {
    const tokens = csrfProtection.generateTokens();
    
    const response = new NextResponse(null, { status: 200 });
    csrfProtection.setTokenCookies(response, tokens);
    
    return response;
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
