'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Maximize2, X } from 'lucide-react';

interface ChannelDescriptionProps {
  description: string;
}

const ChannelDescription: React.FC<ChannelDescriptionProps> = ({ description }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const MAX_HEIGHT = 320; // h-80 equivalent in pixels

  // Measure content height after description loads
  useEffect(() => {
    if (description && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [description]);

  // Markdown components configuration
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

  if (!description) {
    return null;
  }

  return (
    <>
      {/* Channel Description Box - Dynamic height with max constraint */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-8 relative"
      >
        <div 
          className="bg-gradient-to-br from-gray-50 to-indigo-50/30 border border-gray-200/60 rounded-xl shadow-sm backdrop-blur-sm flex flex-col relative"
          style={{ 
            height: contentHeight > 0 ? Math.min(contentHeight + 48, MAX_HEIGHT) : 'auto',
            maxHeight: MAX_HEIGHT 
          }}
        >
          <div className="flex-1 min-h-0 p-6 relative">
            {/* Hidden content for measurement */}
            <div 
              ref={contentRef}
              className="prose prose-sm prose-gray max-w-none absolute invisible"
              style={{ top: 0, left: 0, right: 0, padding: '24px' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {description}
              </ReactMarkdown>
            </div>
            
            {/* Visible content */}
            <div className={`prose prose-sm prose-gray max-w-none h-full pr-2 ${contentHeight > MAX_HEIGHT - 48 ? 'overflow-y-auto scrollbar-thin' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {description}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* View More Button - Show when content exceeds max height */}
          {contentHeight > MAX_HEIGHT - 48 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowFullDescription(true)}
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>View More</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Full Description Popup Dialog */}
      <AnimatePresence>
        {showFullDescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullDescription(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Channel Description</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFullDescription(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Dialog Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {description}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChannelDescription;
