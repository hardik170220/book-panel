import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response with proper JSON
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Logged out successfully' 
      },
      { status: 200 }
    );

    // Clear cookies with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // Clear various possible auth cookies
    response.cookies.set('next-auth.session-token', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });
    response.cookies.set('next-auth.csrf-token', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });
    response.cookies.set('next-auth.callback-url', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });
    response.cookies.set('__Secure-next-auth.session-token', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });
    response.cookies.set('__Host-next-auth.csrf-token', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });

    // Clear any custom auth cookies you might have
    response.cookies.set('admin-ui-forms', '', { 
      ...cookieOptions, 
      expires: new Date(0) 
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed',
      message: 'Use POST method for logout' 
    },
    { status: 405 }
  );
}