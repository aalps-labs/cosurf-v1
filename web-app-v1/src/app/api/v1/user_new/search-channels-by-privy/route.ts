import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Real API endpoint for channel search by Privy ID - connects to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privy_id } = body;

    if (!privy_id) {
      return NextResponse.json(
        { detail: 'Privy ID is required' },
        { status: 400 }
      );
    }

    // Make real API call to backend
    const backendUrl = buildApiUrl('/api/v1/user_new/search-channels-by-privy');
    
    console.log('Searching channels by Privy ID in backend:', {
      privy_id,
      backend_url: backendUrl
    });

    const response = await makeApiRequest(backendUrl, {
      method: 'POST',
      body: JSON.stringify({ privy_id })
    });

    const result = await response.json();
    
    console.log('Backend response for Privy ID channel search:', {
      status: response.status,
      privy_id,
      channel_count: result.channels?.length || 0,
      total: result.total
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Channel search by Privy ID error:', error);
    
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
