import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Channel follow/unfollow endpoint - matches the documented API
export async function PUT(
  request: NextRequest,
  { params }: { params: { channel_id: string } }
) {
  try {
    const { channel_id } = params;
    const body = await request.json();
    
    // Validate required fields
    const { follower_id, followed_id, action } = body;
    
    if (!follower_id || !followed_id || !action) {
      return NextResponse.json(
        { detail: 'follower_id, followed_id, and action are required' },
        { status: 400 }
      );
    }

    if (!['follow', 'unfollow', 'mute', 'unmute'].includes(action)) {
      return NextResponse.json(
        { detail: 'action must be one of: follow, unfollow, mute, unmute' },
        { status: 400 }
      );
    }

    // Verify that the channel_id matches the follower_id
    if (channel_id !== follower_id) {
      return NextResponse.json(
        { detail: 'Channel ID in URL must match follower_id in request body' },
        { status: 400 }
      );
    }

    // Build the backend URL
    const backendUrl = buildApiUrl(`/api/v1/channels/${channel_id}/follow`);
    
    console.log('Processing follow action:', {
      channel_id,
      follower_id,
      followed_id,
      action,
      backend_url: backendUrl
    });

    // Make the API request to the backend
    const response = await makeApiRequest(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        follower_id,
        followed_id,
        action
      })
    });

    const result = await response.json();
    
    console.log('Backend response for follow action:', {
      status: response.status,
      action,
      follower_id,
      followed_id,
      result
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Follow action error:', error);
    
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
