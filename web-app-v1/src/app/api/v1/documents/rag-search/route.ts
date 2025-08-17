import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl, makeApiRequest } from '@/lib/api-config';

// Documents RAG Search API endpoint - connects to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      channel_id, 
      query, 
      channel_ids,
      folder_ids,
      include_subfolders = true,
      top_k = 15,
      similarity_threshold = 0.3,
      context_window = 2,
      include_content = false,
      include_source = true
    } = body;

    if (!channel_id) {
      return NextResponse.json(
        { detail: 'Channel ID is required for access verification' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { detail: 'Query is required for RAG search' },
        { status: 400 }
      );
    }

    // Make real API call to backend
    const backendUrl = buildApiUrl('/api/v1/documents/rag-search');
    
    console.log('🔍 RAG SEARCH: Calling backend with:', {
      channel_id,
      query: query.substring(0, 100) + '...',
      channel_ids: channel_ids?.length || 0,
      folder_ids: folder_ids?.length || 0,
      top_k,
      similarity_threshold,
      backend_url: backendUrl
    });

    const searchPayload = {
      channel_id,
      query,
      ...(channel_ids && { channel_ids }),
      ...(folder_ids && { folder_ids }),
      include_subfolders,
      top_k,
      similarity_threshold,
      context_window,
      include_content,
      include_source
    };

    const response = await makeApiRequest(backendUrl, {
      method: 'POST',
      body: JSON.stringify(searchPayload)
    });

    const result = await response.json();
    
    console.log('✅ RAG SEARCH: Backend response:', {
      status: response.status,
      success: result.success,
      results_count: result.results?.length || 0,
      search_time_ms: result.searchMetadata?.searchTimeMs,
      total_chunks_searched: result.searchMetadata?.totalChunksSearched
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ RAG SEARCH: Error:', error);
    
    // Return appropriate error based on the type
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false,
          detail: 'Backend server unavailable. Please try again later.',
          results: [],
          searchMetadata: null
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        detail: 'Internal server error during RAG search',
        results: [],
        searchMetadata: null
      },
      { status: 500 }
    );
  }
}
