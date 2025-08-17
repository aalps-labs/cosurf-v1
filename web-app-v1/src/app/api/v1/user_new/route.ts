import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Real API endpoint for user creation/update - connects to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privy_data } = body;

    if (!privy_data || !privy_data.id) {
      return NextResponse.json(
        { detail: 'Invalid privy_data provided' },
        { status: 400 }
      );
    }

    // Make real API call to backend
    const backendUrl = buildApiUrl('/api/v1/user_new');
    
    console.log('Creating/updating Privy user in backend:', {
      privy_id: privy_data.id,
      email: privy_data.email?.address,
      wallet: privy_data.wallet?.address,
      backend_url: backendUrl
    });

    const response = await makeApiRequest(backendUrl, {
      method: 'POST',
      body: JSON.stringify({ privy_data })
    });

    const result = await response.json();
    
    console.log('Backend response for user creation:', {
      status: response.status,
      user_id: result.user?.id,
      privy_id: result.user?.privy_id,
      full_response: result
    });

    // Validate the response structure matches expected schema
    if (!result.user || !result.user.id) {
      console.error('❌ Invalid backend response structure:', result);
      return NextResponse.json(
        { detail: 'Backend returned invalid user data structure' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('User creation error:', error);
    
    // Return appropriate error based on the type
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { detail: 'Backend server unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}