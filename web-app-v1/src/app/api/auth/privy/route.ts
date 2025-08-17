// Privy authentication API endpoint - REAL implementation
import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { linkPrivyUser, getUserByPrivyId } from '@/lib/auth/user-service';

// Initialize Privy client with App ID and App Secret
const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.NEXT_PRIVY_APP_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const { action, accessToken } = await request.json();

    // Validate required fields
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access token is required' 
      }, { status: 400 });
    }

    // Verify the Privy access token - THIS IS THE REAL AUTHENTICATION
    let tokenClaims;
    try {
      tokenClaims = await privyClient.verifyAuthToken(accessToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // Get the full user data using the verified user ID
    let verifiedUser;
    try {
      verifiedUser = await privyClient.getUserById(tokenClaims.userId);
    } catch (error) {
      console.error('Failed to get user data:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve user data' 
      }, { status: 500 });
    }

    if (action === 'login') {
      // Handle login + linking with VERIFIED user data
      const result = await linkPrivyUser(verifiedUser);
      
      return NextResponse.json({
        success: result.success,
        user: result.user,
        linked: result.linked,
        message: result.message,
        error: result.error
      });
    }

    if (action === 'verify') {
      // Handle session verification with VERIFIED user data
      const userData = await getUserByPrivyId(verifiedUser.id);
      
      return NextResponse.json({
        success: !!userData,
        user: userData?.user,
        authType: userData?.type,
        privyUser: verifiedUser
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Privy auth endpoint is running' 
  });
}
