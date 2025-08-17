import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds for AI model processing
export const maxDuration = 30;

type ModelProvider = 'openai' | 'google' | 'anthropic';

// All supported model names based on Vercel AI SDK documentation
type ModelName = 
  // OpenAI Models
  | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo'
  | 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4.1-nano'
  | 'o3-mini' | 'o3' | 'o4-mini' | 'o1' | 'o1-mini' | 'o1-preview'
  // Google Gemini Models
  | 'gemini-2.5-pro' | 'gemini-2.5-flash'
  | 'gemini-2.5-pro-preview-05-06' | 'gemini-2.5-flash-preview-04-17'
  | 'gemini-2.5-pro-exp-03-25'
  | 'gemini-2.0-flash' | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro' | 'gemini-1.5-pro-latest'
  | 'gemini-1.5-flash' | 'gemini-1.5-flash-latest'
  | 'gemini-1.5-flash-8b' | 'gemini-1.5-flash-8b-latest'
  // Anthropic Claude Models (with correct official names)
  | 'claude-4-opus-20250514' | 'claude-4-sonnet-20250514'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-20241022' | 'claude-3-5-sonnet-20240620'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';

interface ChatRequest {
  prompt: string;
  model?: ModelName;
  provider?: ModelProvider;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * Supported model configurations 
 * Simplified to only track provider mappings - API providers handle their own limits
 */
const MODEL_CONFIG = {
  // OpenAI Models
  'gpt-4o': { provider: 'openai' },
  'gpt-4o-mini': { provider: 'openai' },
  'gpt-4-turbo': { provider: 'openai' },
  'gpt-4': { provider: 'openai' },
  'gpt-3.5-turbo': { provider: 'openai' },
  'gpt-4.1': { provider: 'openai' },
  'gpt-4.1-mini': { provider: 'openai' },
  'gpt-4.1-nano': { provider: 'openai' },
  'o3-mini': { provider: 'openai' },
  'o3': { provider: 'openai' },
  'o4-mini': { provider: 'openai' },
  'o1': { provider: 'openai' },
  'o1-mini': { provider: 'openai' },
  'o1-preview': { provider: 'openai' },

  // Google Gemini Models
  'gemini-2.5-pro': { provider: 'google' },
  'gemini-2.5-flash': { provider: 'google' },
  'gemini-2.5-pro-preview-05-06': { provider: 'google' },
  'gemini-2.5-flash-preview-04-17': { provider: 'google' },
  'gemini-2.5-pro-exp-03-25': { provider: 'google' },
  'gemini-2.0-flash': { provider: 'google' },
  'gemini-2.0-flash-exp': { provider: 'google' },
  'gemini-1.5-pro': { provider: 'google' },
  'gemini-1.5-pro-latest': { provider: 'google' },
  'gemini-1.5-flash': { provider: 'google' },
  'gemini-1.5-flash-latest': { provider: 'google' },
  'gemini-1.5-flash-8b': { provider: 'google' },
  'gemini-1.5-flash-8b-latest': { provider: 'google' },

  // Anthropic Claude Models
  'claude-4-opus-20250514': { provider: 'anthropic' },
  'claude-4-sonnet-20250514': { provider: 'anthropic' },
  'claude-3-7-sonnet-20250219': { provider: 'anthropic' },
  'claude-3-5-sonnet-20241022': { provider: 'anthropic' },
  'claude-3-5-sonnet-20240620': { provider: 'anthropic' },
  'claude-3-5-haiku-20241022': { provider: 'anthropic' },
  'claude-3-opus-20240229': { provider: 'anthropic' },
  'claude-3-sonnet-20240229': { provider: 'anthropic' },
  'claude-3-haiku-20240307': { provider: 'anthropic' }
} as const;

/**
 * Get the appropriate model instance based on provider and model name.
 * Supports OpenAI, Google (Gemini), and Anthropic (Claude) models.
 */
function getModel(provider: ModelProvider, modelName: ModelName) {
  switch (provider) {
    case 'openai':
      return openai(modelName as any);
    case 'google':
      return google(modelName as any);
    case 'anthropic':
      return anthropic(modelName as any);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Determine the provider based on model name if not explicitly specified.
 */
function getProviderFromModel(modelName: ModelName): ModelProvider {
  if (modelName.startsWith('gpt-') || modelName.startsWith('o1') || modelName.startsWith('o3') || modelName.startsWith('o4')) {
    return 'openai';
  }
  if (modelName.startsWith('gemini-')) {
    return 'google';
  }
  if (modelName.startsWith('claude-')) {
    return 'anthropic';
  }
  // Default fallback
  return 'openai';
}

/**
 * POST endpoint for AI chat completions supporting multiple model providers.
 * 
 * Supports OpenAI, Google Gemini, and Anthropic Claude models with intelligent 
 * provider detection and comprehensive parameter validation.
 * 
 * @example Basic usage with Gemini (default):
 * ```
 * fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     prompt: 'Hello, how are you?'
 *   })
 * })
 * ```
 * 
 * @example Using OpenAI model:
 * ```
 * fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     prompt: 'Explain quantum computing',
 *     model: 'gpt-4o-mini',
 *     maxTokens: 1000,
 *     temperature: 0.3
 *   })
 * })
 * ```
 * 
 * @example Using non-streaming response:
 * ```
 * fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     prompt: 'Write a story about AI',
 *     model: 'claude-3-5-sonnet-20241022',
 *     temperature: 0.9,
 *     stream: false
 *   })
 * })
 * ```
 * 
 * @param req - Request object containing chat parameters
 * @returns Streaming response with AI-generated content or JSON response for non-streaming
 */
export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      model = 'gemini-2.0-flash', // Default to Gemini 2.0 Flash for cost-effectiveness
      provider,
      maxTokens,
      temperature = 0.7,
      stream = true // Default to streaming for backward compatibility
    }: ChatRequest = await req.json();

    if (!prompt) {
      return new NextResponse(JSON.stringify({ error: 'Prompt is required' }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate model exists in configuration
    if (!MODEL_CONFIG[model]) {
      const supportedModels = Object.keys(MODEL_CONFIG).join(', ');
      return new NextResponse(JSON.stringify({ 
        error: `Unsupported model '${model}'. Supported models: ${supportedModels}` 
      }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    const modelConfig = MODEL_CONFIG[model];
    
    // Determine provider if not specified
    const finalProvider = provider || modelConfig.provider as ModelProvider;
    
    // Validate provider matches model configuration
    if (finalProvider !== modelConfig.provider) {
      return new NextResponse(JSON.stringify({ 
        error: `Provider '${finalProvider}' does not match model '${model}'. Expected provider: '${modelConfig.provider}'` 
      }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate required environment variables
    if (finalProvider === 'openai' && !process.env.OPENAI_API_KEY) {
      return new NextResponse(JSON.stringify({ 
        error: 'Service temporarily unavailable. Please try again later.' 
      }), { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    if (finalProvider === 'google' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new NextResponse(JSON.stringify({ 
        error: 'Service temporarily unavailable. Please try again later.' 
      }), { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    if (finalProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return new NextResponse(JSON.stringify({ 
        error: 'Service temporarily unavailable. Please try again later.' 
      }), { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }

    // Get the appropriate model instance
    const modelInstance = getModel(finalProvider, model);

    console.log(`🤖 Using ${finalProvider} model: ${model} (maxTokens: ${maxTokens}, temperature: ${temperature}, stream: ${stream})`);

    const baseOptions = {
      model: modelInstance,
      prompt,
      maxTokens: maxTokens || undefined, // Let API provider handle defaults
      temperature: temperature || 0.7,
    };

    if (stream) {
      // Streaming response with unified format
      const result = streamText(baseOptions);
      
      // Create a custom streaming response that converts to our unified format
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              // Send each chunk in our unified format: 0:"text chunk"
              const formattedChunk = `0:${JSON.stringify(chunk)}\n`;
              controller.enqueue(encoder.encode(formattedChunk));
            }
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const result = await generateText(baseOptions);
      
      return new NextResponse(JSON.stringify({
        text: result.text,
        model: model,
        provider: finalProvider
      }), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
    }
    return new NextResponse(JSON.stringify({ error: 'An unknown error occurred' }), { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * GET endpoint to list supported models and their configurations
 */
export async function GET() {
  try {
    const models = Object.entries(MODEL_CONFIG).map(([name, config]) => ({
      name,
      provider: config.provider,
    }));

    const response = {
      supportedModels: models,
      defaultModel: 'gemini-2.0-flash',
      providers: ['openai', 'google', 'anthropic'],
      modelCount: {
        total: models.length,
        byProvider: {
          openai: models.filter(m => m.provider === 'openai').length,
          google: models.filter(m => m.provider === 'google').length,
          anthropic: models.filter(m => m.provider === 'anthropic').length,
        }
      },
      usage: {
        endpoint: '/api/chat',
        method: 'POST',
        body: {
          prompt: 'string (required)',
          model: 'string (optional, default: gemini-2.0-flash)',
          provider: 'string (optional, auto-detected from model)',
          maxTokens: 'number (optional, provider handles defaults)',
          temperature: 'number (optional, default: 0.7)',
          stream: 'boolean (optional, default: true)',
        },
        examples: [
          {
            description: 'Basic chat with default model (streaming)',
            request: {
              prompt: 'Hello, how are you?'
            }
          },
          {
            description: 'Chat with specific model (streaming)',
            request: {
              prompt: 'Explain quantum computing',
              model: 'gpt-4o-mini',
              maxTokens: 1000
            }
          },
          {
            description: 'Non-streaming response',
            request: {
              prompt: 'Write a short story about AI',
              model: 'claude-3-5-sonnet-20241022',
              temperature: 0.9,
              stream: false
            }
          }
        ]
      }
    };

    return new NextResponse(JSON.stringify(response, null, 2), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Models API error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // More restrictive in production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new NextResponse(null, { status: 204, headers });
}
