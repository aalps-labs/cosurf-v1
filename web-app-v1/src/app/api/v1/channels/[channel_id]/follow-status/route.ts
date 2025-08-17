import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Get follow status between two channels
export async function GET(
  request: NextRequest,
  { params }: { params: { channel_id: string } }
) {
  try {
    const { channel_id } = params;
    const { searchParams } = new URL(request.url);
    
    // Get the follower_id from query parameters
    const followerId = searchParams.get('follower_id');
    
    if (!followerId) {
      return NextResponse.json(
        { detail: 'follower_id query parameter is required' },
        { status: 400 }
      );
    }

    // Build the backend URL
    const backendUrl = buildApiUrl(`/api/v1/channels/${channel_id}/follow-status?follower_id=${followerId}`);
    
    console.log('Getting follow status:', {
      channel_id,
      follower_id: followerId,
      backend_url: backendUrl
    });

    // Make the API request to the backend
    const response = await makeApiRequest(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    console.log('Backend response for follow status:', {
      status: response.status,
      channel_id,
      follower_id: followerId,
      is_following: result.is_following,
      is_muted: result.is_muted
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Follow status check error:', error);
    
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
