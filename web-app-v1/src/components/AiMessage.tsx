import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  onCitationsExtracted?: (citationNumbers: number[]) => void;
}

// Helper function to extract domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const AiMessage: React.FC<AiMessageProps> = ({ message, onCitationsExtracted }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showCollaborative, setShowCollaborative] = useState(false);
  const [hoveredReference, setHoveredReference] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for tooltip visibility - strict hover behavior
  const showTooltip = (referenceId: string, position: { x: number; y: number }) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredReference(referenceId);
    setTooltipPosition(position);
  };

  const hideTooltip = () => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Hide immediately when mouse leaves
    setHoveredReference(null);
    setTooltipPosition(null);
  };

  const cancelHideTooltip = () => {
    // Don't cancel hide - we want strict hover behavior
    // This function is kept for compatibility but does nothing
  };

  // Extract citation numbers from content and notify parent
  useEffect(() => {
    if (message.content && onCitationsExtracted) {
      const citationPattern = /\[(\d+)\]/g;
      const citationNumbers = new Set<number>();
      let match;

      while ((match = citationPattern.exec(message.content)) !== null) {
        const citationNumber = parseInt(match[1]);
        citationNumbers.add(citationNumber);
      }

      const uniqueCitations = Array.from(citationNumbers).sort((a, b) => a - b);
      onCitationsExtracted(uniqueCitations);
    }
  }, [message.content, onCitationsExtracted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Markdown components configuration (same as ChannelDescription)
  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="text-xl font-bold text-gray-900 mb-3">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-semibold text-gray-800 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-medium text-gray-800 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside text-gray-700 space-y-1 mb-3">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-700">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-gray-800">{children}</em>,
    del: ({ children }: any) => <del className="line-through text-gray-500">{children}</del>,
    code: ({ children }: any) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
    pre: ({ children }: any) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-800 mb-3">{children}</pre>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-3">{children}</blockquote>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-gray-50">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="bg-white">{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">{children}</tr>,
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
        {children}
      </td>
    ),
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
      >
        {children}
      </a>
    ),
  };

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

  // Custom citation link component (expert approach)
  const CitationLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
    // Extract citation number from URL fragment
    const citationMatch = href?.match(/#citation-(\d+)$/);
    
    if (!citationMatch || !message.references) {
      return <span>{children}</span>;
    }
    
    const citationNumber = parseInt(citationMatch[1]);
    const referenceIndex = citationNumber - 1;
    const reference = message.references[referenceIndex];
    
    if (!reference) {
      return <span>{children}</span>;
    }
    
    // Get the actual URL without the citation fragment
    const actualUrl = href?.replace(/#citation-\d+$/, '') || reference.url;
    
    const uniqueReferenceId = `citation-${referenceIndex}-${citationNumber}`;
    
    return (
      <span className="relative inline-block">
        <button
          className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
          onClick={() => {
            if (actualUrl) {
              window.open(actualUrl, '_blank');
            }
          }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            showTooltip(uniqueReferenceId, {
              x: rect.left + rect.width / 2,
              y: rect.top
            });
          }}
          onMouseLeave={hideTooltip}
        >
          {citationNumber}
        </button>
        
        {/* Compact Hover Tooltip - Rendered via Portal to avoid nesting issues */}
        {hoveredReference === uniqueReferenceId && tooltipPosition && typeof document !== 'undefined' && createPortal(
          <div 
            className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 8,
              transform: 'translate(-50%, -100%)'
            }}
          >
            {/* Header with favicon and title */}
            <div className="flex items-center gap-2 mb-2 h-4">
              {/* Reference Number */}
              <div className="flex-shrink-0 w-4 h-4 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full flex items-center justify-center">
                {citationNumber}
              </div>
              
              {/* Favicon */}
              <div className="flex-shrink-0 relative">
                <img
                  src={reference.favicon && reference.favicon.trim() !== '' ? reference.favicon : `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(actualUrl)}&sz=16`}
                  alt=""
                  className="w-3 h-3 rounded-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallbackUrl = `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(actualUrl)}&sz=16`;
                    if (target.src !== fallbackUrl) {
                      target.src = fallbackUrl;
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
              <div className="text-xs text-gray-500 truncate flex-1" title={actualUrl}>
                {actualUrl}
              </div>
              <ExternalLink className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" />
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
          </div>,
          document.body
        )}
      </span>
    );
  };

  // Preprocess content to convert citations to markdown links (expert approach)
  const preprocessContent = (content: string) => {
    if (!message.references || message.references.length === 0) {
      return content;
    }
    
    // Convert [n] patterns to markdown links with actual document URLs
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      const citationNumber = parseInt(num);
      const referenceIndex = citationNumber - 1;
      const reference = message.references![referenceIndex];
      
      if (reference && reference.url) {
        // Convert to markdown link format with actual URL but special class for styling
        // We'll add a special marker to identify these as citations in the URL fragment
        return `[${match}](${reference.url}#citation-${citationNumber})`;
      }
      
      return match;
    });
  };

  // Enhanced markdown components with citation handling
  const enhancedMarkdownComponents = {
    ...markdownComponents,
    // Override link component to handle citations
    a: ({ href, children }: any) => {
      // Check if this is a citation link (has #citation- fragment)
      if (href && href.includes('#citation-')) {
        return <CitationLink href={href}>{children}</CitationLink>;
      }
      
      // Regular link
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 hover:text-indigo-800 underline font-medium"
        >
          {children}
        </a>
      );
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

    // Preprocess content to convert citations to markdown links
    const processedContent = preprocessContent(message.content);

    // Show streaming indicator with content
    if (message.isStreaming && message.content) {
      return (
        <div className="space-y-2">
          <div className="prose prose-sm prose-gray max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={enhancedMarkdownComponents}>
              {processedContent}
            </ReactMarkdown>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Streaming...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-sm prose-gray max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={enhancedMarkdownComponents}>
          {processedContent}
        </ReactMarkdown>
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
