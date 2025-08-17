'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, ExternalLink, Globe, FileText } from 'lucide-react';

// Types based on the publishing service structure
interface FolderItem {
  id: string;
  surfId: string;
  notes?: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  items: FolderItem[];
  subfolders: Folder[];
  readme?: any;
  isPublic: boolean;
  currentHash?: string;
  lastPushedHash?: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  title: string;
  canonicalUrl: string;
  faviconUrl?: string;
  iconUrl?: string;
  processStatus: string;
  hasContent: boolean;
  isRagProcessed: boolean;
  docType: 'WEB' | 'FILE';
}

interface FolderTreeProps {
  folders: Folder[];
  documents: Document[];
  onDocumentClick?: (document: Document) => void;
}

interface FolderNodeProps {
  folder: Folder;
  documents: Document[];
  level: number;
  onDocumentClick?: (document: Document) => void;
}

interface DocumentItemProps {
  document: Document;
  onClick?: (document: Document) => void;
}

// Document Item Component
const DocumentItem: React.FC<DocumentItemProps> = ({ document, onClick }) => {
  const [showFallback, setShowFallback] = React.useState(false);

  const getGoogleFaviconUrl = (url: string) => {
    try {
      // Handle file:// URLs and other non-http protocols
      if (!url || url.startsWith('file://') || !url.includes('://')) {
        return null;
      }
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  const handleFaviconError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const googleFaviconUrl = getGoogleFaviconUrl(document.canonicalUrl);
    
    // First try Google's favicon service if we haven't already
    if (googleFaviconUrl && target.src !== googleFaviconUrl) {
      target.src = googleFaviconUrl;
    } else {
      // Final fallback - hide image and show fallback
      setShowFallback(true);
    }
  };

  const getFaviconSrc = () => {
    // Priority: document's favicon -> Google's favicon service
    if (document.faviconUrl && document.faviconUrl.trim() !== '') {
      return document.faviconUrl;
    }
    return getGoogleFaviconUrl(document.canonicalUrl);
  };

  const renderDocumentIcon = () => {
    // Show fallback icon if favicon failed or for file types
    if (showFallback || document.docType === 'FILE') {
      return document.docType === 'WEB' ? (
        <Globe className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
      ) : (
        <FileText className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
      );
    }

    // Try to show favicon for web documents
    const faviconSrc = getFaviconSrc();
    if (faviconSrc && document.docType === 'WEB') {
      return (
        <img 
          src={faviconSrc}
          alt="favicon"
          className="w-4 h-4 rounded-sm flex-shrink-0"
          onError={handleFaviconError}
        />
      );
    }

    // Default fallback
    return document.docType === 'WEB' ? (
      <Globe className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
    ) : (
      <FileText className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
    );
  };



  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ 
        x: 3,
        backgroundColor: "rgba(99, 102, 241, 0.04)",
        transition: { duration: 0.2 }
      }}
      className="group flex items-center space-x-1.5 py-0.5 px-1.5 rounded-md cursor-pointer transition-all duration-300 hover:shadow-sm border border-transparent hover:border-indigo-100/50"
      onClick={() => onClick?.(document)}
    >
      {/* Document Icon */}
      <div className="flex-shrink-0">
        {renderDocumentIcon()}
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 truncate font-medium group-hover:text-indigo-700 transition-colors duration-200 block">
          {document.title || 'Untitled'}
        </span>
        
        {/* URL Preview */}
        {document.canonicalUrl && (
          <span className="text-xs text-gray-400 truncate group-hover:text-gray-500 transition-colors duration-200 block opacity-75">
            {new URL(document.canonicalUrl).hostname}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Folder Node Component (Recursive)
const FolderNode: React.FC<FolderNodeProps> = ({ folder, documents, level, onDocumentClick }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  // Get documents for this folder
  const folderDocuments = folder.items
    .map(item => documents.find(doc => doc.id === item.surfId))
    .filter((doc): doc is Document => doc !== undefined);

  const hasContent = folderDocuments.length > 0 || folder.subfolders.length > 0;
  const indentLevel = level * 12;

  return (
    <div className="select-none">
      {/* Folder Header */}
      <motion.div
        className="flex items-center space-x-2.5 py-2.5 px-3 rounded-xl cursor-pointer group transition-all duration-300 hover:shadow-sm relative overflow-hidden"
        style={{ 
          paddingLeft: `${12 + indentLevel}px`,
          background: isExpanded 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)'
            : 'transparent'
        }}
        onClick={() => hasContent && setIsExpanded(!isExpanded)}
        whileHover={{ 
          x: 2,
          backgroundColor: isExpanded 
            ? "rgba(99, 102, 241, 0.08)" 
            : "rgba(99, 102, 241, 0.04)",
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {hasContent ? (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" strokeWidth={2} />
            </motion.div>
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Folder Icon with Gradient */}
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-200" />
          {isExpanded && hasContent ? (
            <FolderOpen className="w-5 h-5 text-indigo-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
          ) : (
            <Folder className="w-5 h-5 text-indigo-700 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
          )}
        </div>

        {/* Folder Name with Enhanced Typography */}
        <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 truncate transition-colors duration-200 tracking-wide">
          {folder.name}
        </span>

        {/* Item Count Badge */}
        {(folderDocuments.length > 0 || folder.subfolders.length > 0) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto"
          >
            <div className="px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200/50 shadow-sm">
              {folderDocuments.length + folder.subfolders.length}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Folder Contents */}
      <AnimatePresence>
        {isExpanded && hasContent && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.3 },
              y: { duration: 0.3 }
            }}
            className="overflow-hidden relative"
          >
            {/* Subtle connecting line */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent opacity-40"
              style={{ left: `${16 + indentLevel}px` }}
            />
            {/* Documents in this folder */}
            {folderDocuments.map(document => (
              <div key={document.id} style={{ paddingLeft: `${20 + indentLevel}px` }}>
                <DocumentItem document={document} onClick={onDocumentClick} />
              </div>
            ))}

            {/* Subfolders */}
            {folder.subfolders.map(subfolder => (
              <FolderNode
                key={subfolder.id}
                folder={subfolder}
                documents={documents}
                level={level + 1}
                onDocumentClick={onDocumentClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Folder Tree Component
const FolderTree: React.FC<FolderTreeProps> = ({ folders, documents, onDocumentClick }) => {
  if (!folders || folders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-xl opacity-30" />
          <Folder className="w-16 h-16 text-indigo-300 relative z-10" strokeWidth={1} />
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold text-gray-500 mb-3 tracking-wide"
        >
          No content yet
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-gray-400 max-w-52 leading-relaxed"
        >
          Your organized content and documents will appear here when available.
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-2 p-1"
    >
      {folders.map((folder, index) => (
        <motion.div
          key={folder.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <FolderNode
            folder={folder}
            documents={documents}
            level={0}
            onDocumentClick={onDocumentClick}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FolderTree;
export type { Folder, Document, FolderItem };
