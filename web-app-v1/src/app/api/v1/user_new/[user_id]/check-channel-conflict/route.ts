import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Real API endpoint for channel conflict check - connects to backend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    
    // Get channel_id from query params or request body
    const url = new URL(request.url);
    let channel_id = url.searchParams.get('channel_id');
    
    if (!channel_id) {
      try {
        const body = await request.json();
        channel_id = body.channel_id;
      } catch (error) {
        // No JSON body, that's fine if we have query param
      }
    }

    if (!channel_id) {
      return NextResponse.json(
        { detail: 'channel_id is required in query params or request body' },
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

    const response = await makeApiRequest(`${backendUrl}?channel_id=${channel_id}`, {
      method: 'POST'
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