import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Sparkles,
  Brain,
  Loader2,
  Globe,
  ExternalLink
} from 'lucide-react';

interface Reference {
  index: number;
  title: string;
  url: string;
  similarity: number;
}

interface CollaborativeResponse {
  channelName: string;
  content: string;
  references: Reference[];
  isError?: boolean;
}

interface AiMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    collaborativeResponses?: CollaborativeResponse[];
    references?: Array<{
      id: string;
      title: string;
      url: string;
      favicon?: string;
      snippet?: string;
      similarity?: number;
      domain?: string;
    }>;
    model?: string;
    isStreaming?: boolean;
  };
}

// Helper function to extract domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const AiMessage: React.FC<AiMessageProps> = ({ message }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showCollaborative, setShowCollaborative] = useState(false);
  const [hoveredReference, setHoveredReference] = useState<string | null>(null);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Parse content and replace references with interactive elements
  const renderContentWithReferences = () => {
    // Show loading state when streaming
    if (message.isStreaming && !message.content) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating response...</span>
        </div>
      );
    }

    // Show streaming indicator with content
    if (message.isStreaming && message.content) {
      return (
        <div className="space-y-2">
          <div 
            className="prose prose-sm max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ 
              __html: message.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')
            }} 
          />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Streaming...</span>
          </div>
        </div>
      );
    }

    if (!message.references || message.references.length === 0) {
      return (
        <div 
          className="prose prose-sm max-w-none text-gray-900"
          dangerouslySetInnerHTML={{ 
            __html: message.content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n/g, '<br>')
          }} 
        />
      );
    }

    // Split content by reference pattern [n]
    const parts = message.content.split(/(\[\d+\])/g);
    
    return (
      <div className="prose prose-sm max-w-none text-gray-900">
        {parts.map((part, index) => {
          const referenceMatch = part.match(/^\[(\d+)\]$/);
          if (referenceMatch) {
            const referenceIndex = parseInt(referenceMatch[1]) - 1;
            const reference = message.references![referenceIndex];
            
            if (reference) {
              // Create unique identifier for this specific reference button instance
              const uniqueReferenceId = `${referenceIndex}-${index}`;
              
              return (
                <span key={index} className="relative inline-block">
                  <button
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
                    onClick={() => {
                      if (reference.url) {
                        window.open(reference.url, '_blank');
                      }
                    }}
                    onMouseEnter={() => setHoveredReference(uniqueReferenceId)}
                    onMouseLeave={() => setHoveredReference(null)}
                  >
                    {referenceIndex + 1}
                  </button>
                  
                  {/* Compact Hover Tooltip */}
                  {hoveredReference === uniqueReferenceId && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                      {/* Header with favicon and title */}
                      <div className="flex items-center gap-2 mb-2 h-4">
                        {/* Reference Number */}
                        <div className="flex-shrink-0 w-4 h-4 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full flex items-center justify-center">
                          {referenceIndex + 1}
                        </div>
                        
                        {/* Favicon */}
                        <div className="flex-shrink-0 relative">
                          <img
                            src={reference.favicon && reference.favicon.trim() !== '' ? reference.favicon : `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(reference.url)}&sz=16`}
                            alt=""
                            className="w-3 h-3 rounded-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const fallbackUrl = `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(reference.url)}&sz=16`;
                              if (target.src !== fallbackUrl) {
                                target.src = fallbackUrl;
                              } else {
                                // Final fallback to globe icon
                                target.style.display = 'none';
                                const globeIcon = target.parentElement?.querySelector('.favicon-fallback');
                                if (!globeIcon) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'favicon-fallback w-3 h-3 rounded-sm bg-gray-100 flex items-center justify-center';
                                  fallback.innerHTML = `
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="2" y1="12" x2="22" y2="12"/>
                                      <path d="m2 12c0 5.5 2.5 10 7.5 10s7.5-4.5 7.5-10"/>
                                      <path d="m2 12c0-5.5 2.5-10 7.5-10s7.5 4.5 7.5 10"/>
                                    </svg>
                                  `;
                                  target.parentElement?.appendChild(fallback);
                                }
                              }
                            }}
                          />
                        </div>
                        
                        {/* Title right next to favicon */}
                        <div className="text-xs font-medium text-gray-900 truncate flex-1 min-w-0 leading-none">
                          {reference.title}
                        </div>
                      </div>

                      {/* Full URL */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 truncate flex-1" title={reference.url}>
                          {reference.url}
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" />
                      </div>
                      
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                    </div>
                  )}
                </span>
              );
            }
          }
          
          // Regular text content
          return (
            <span 
              key={index} 
              dangerouslySetInnerHTML={{ 
                __html: part
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br>')
              }} 
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-6 border-b border-purple-200 pb-6">
      {/* Collaborative Thinking Section */}
      {message.collaborativeResponses && message.collaborativeResponses.length > 0 && (
        <div className="mb-4 bg-emerald-50/50 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCollaborative(!showCollaborative)}
            className="w-full flex items-center justify-between p-3 hover:bg-emerald-100/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-medium text-emerald-800">
                Collaborative Thinking ({message.collaborativeResponses.length} insight{message.collaborativeResponses.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-emerald-600">
              {showCollaborative ? '−' : '+'}
            </div>
          </button>
          
          {showCollaborative && (
            <div className="bg-white/50 p-3 space-y-3">
              {message.collaborativeResponses.map((response, index) => (
                <div 
                  key={index} 
                  className={`rounded-md p-3 ${
                    response.isError 
                      ? 'bg-red-50' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full text-white text-[9px] font-medium flex items-center justify-center ${
                      response.isError ? 'bg-red-500' : 'bg-orange-500'
                    }`}>
                      {response.isError ? '!' : response.channelName.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium ${
                      response.isError ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      {response.channelName} {response.isError && '(Offline)'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({response.references?.length || 0} references)
                    </span>
                  </div>
                  <div className={`text-sm ${response.isError ? 'text-red-600 italic' : ''}`}>
                    {response.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main AI Message */}
      <div className="flex items-start">
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Message Text with References */}
          <div className="mb-4">
            {renderContentWithReferences()}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 mt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Copy message"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {isCopied ? 'Copied' : 'Copy'}
            </button>

            <button
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Good response"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>

            <button
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Poor response"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>

            <button
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiMessage;
