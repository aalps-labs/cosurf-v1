import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Get channels that this channel is following
export async function GET(
  request: NextRequest,
  { params }: { params: { channel_id: string } }
) {
  try {
    const { channel_id } = params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const params_obj = new URLSearchParams();
    
    // Pagination
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '10';
    params_obj.append('page', page);
    params_obj.append('size', size);
    
    // Sorting
    const sortBy = searchParams.get('sort_by');
    if (sortBy) {
      params_obj.append('sort_by', sortBy);
    }
    
    const sortOrder = searchParams.get('sort_order');
    if (sortOrder) {
      params_obj.append('sort_order', sortOrder);
    }

    // Build the backend URL
    const backendUrl = buildApiUrl(`/api/v1/channels/${channel_id}/following?${params_obj.toString()}`);
    
    console.log('Getting following list for channel:', {
      channel_id,
      page,
      size,
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
    
    console.log('Backend response for following list:', {
      status: response.status,
      channel_id,
      following_count: result.channels?.length || 0,
      total: result.total
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Get following list error:', error);
    
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
