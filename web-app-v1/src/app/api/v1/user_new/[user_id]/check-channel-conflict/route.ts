import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Real API endpoint for channel conflict check - connects to backend
export async function POST(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const { user_id } = params;
    const body = await request.json();
    const { channel_id } = body;

    if (!channel_id) {
      return NextResponse.json(
        { detail: 'channel_id is required in request body' },
        { status: 400 }
      );
    }

    // Make real API call to backend
    const backendUrl = buildApiUrl('/api/v1/user_new/{user_id}/check-channel-conflict', {
      user_id
    });
    
    console.log('Checking channel conflict in backend:', {
      user_id,
      channel_id,
      backend_url: backendUrl
    });

    const response = await makeApiRequest(backendUrl, {
      method: 'POST',
      body: JSON.stringify({ channel_id })
    });

    const result = await response.json();
    
    console.log('Backend response for conflict check:', {
      status: response.status,
      user_id,
      channel_id,
      has_conflict: result.has_conflict,
      can_connect: result.can_connect
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Channel conflict check error:', error);
    
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