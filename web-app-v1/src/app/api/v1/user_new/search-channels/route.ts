import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Real API endpoint for channel search - connects to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, privy_id } = body;

    if (!email && !privy_id) {
      return NextResponse.json(
        { detail: 'At least one of email or privy_id is required' },
        { status: 400 }
      );
    }

    // Make real API call to backend
    const backendUrl = buildApiUrl('/api/v1/user_new/search-channels');
    
    console.log('Searching channels by criteria in backend:', {
      email,
      privy_id,
      backend_url: backendUrl
    });

    const searchCriteria: any = {};
    if (email) searchCriteria.email = email;
    if (privy_id) searchCriteria.privy_id = privy_id;

    const response = await makeApiRequest(backendUrl, {
      method: 'POST',
      body: JSON.stringify(searchCriteria)
    });

    const result = await response.json();
    
    console.log('Backend response for channel search:', {
      status: response.status,
      email,
      privy_id,
      channel_count: result.channels?.length || 0,
      total: result.total
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Channel search error:', error);
    
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