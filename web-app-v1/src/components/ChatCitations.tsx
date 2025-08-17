import React from 'react';
import { 
  Globe
} from 'lucide-react';

interface Reference {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  snippet?: string;
  domain?: string;
  publishedDate?: string;
}

interface ChatCitationsProps {
  references: Reference[];
  title?: string;
  isCollapsible?: boolean;
}

// Helper function to extract domain from URL for favicon fallback
const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const ChatCitations: React.FC<ChatCitationsProps> = ({ 
  references 
}) => {

  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div className="my-3 w-full">
      <div className="w-full max-w-full overflow-hidden">
        {/* Surf reference cards - horizontal layout */}
        <div 
          className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent max-w-full" 
          style={{ 
            scrollbarWidth: 'thin',
            msOverflowStyle: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {references.map((reference, index) => (
            <div
              key={reference.id || index}
              className="group relative bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-sm flex-shrink-0 w-[220px] min-w-[220px] p-2"
            >
              {/* Header with index, favicon, and title inline */}
              <div className="flex items-center gap-2 mb-2">
                {/* Index Number */}
                <div className="flex-shrink-0 w-4 h-4 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                
                {/* Favicon */}
                <div className="flex-shrink-0 relative">
                  <img
                    src={reference.favicon && reference.favicon.trim() !== '' ? reference.favicon : `https://www.google.com/s2/favicons?domain=${getDomainFromUrl(reference.url)}&sz=16`}
                    alt=""
                    className="w-4 h-4 rounded-sm"
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
                          fallback.className = 'favicon-fallback w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center';
                          fallback.innerHTML = `
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
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

                {/* Title inline with favicon */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate" title={reference.title}>
                    {reference.title}
                  </div>
                </div>
              </div>

              {/* Full URL */}
              <div className="text-xs text-gray-500 truncate pl-6" title={reference.url}>
                {reference.url}
              </div>

              {/* Link overlay */}
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 rounded-lg"
                title={`Open ${reference.title}`}
              >
                <span className="sr-only">Open {reference.title}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatCitations;
