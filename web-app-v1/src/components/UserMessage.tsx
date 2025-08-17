import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

interface UserMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
  };
  onEdit?: (messageId: string, newContent: string) => void;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  // Character limit to determine short vs long messages
  const characterLimit = 100;
  const isShortMessage = message.content.length <= characterLimit;
  
  // For long messages, show first 2 lines worth of characters
  const truncatedLength = 120;
  const shouldTruncate = message.content.length > truncatedLength;
  const displayContent = isExpanded || !shouldTruncate 
    ? message.content 
    : message.content.substring(0, truncatedLength) + '...';

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="group mb-4 border-b border-purple-200 pb-4 hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2">
      {/* Message Content */}
      <div className="mb-3 relative">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-200 rounded-lg text-base text-gray-900 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={Math.max(2, Math.ceil(editContent.length / 80))}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                Save & Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            <div 
              className={`text-gray-900 leading-relaxed ${
                isShortMessage 
                  ? 'text-2xl font-medium' 
                  : 'text-base'
              }`}
            >
              {displayContent}
            </div>
            
            {/* Edit button - appears on hover */}
            <button
              onClick={handleEdit}
              className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md shadow-sm border border-gray-200 transition-all duration-200"
              title="Edit message"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            
            {/* Expand/Collapse for long messages */}
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show more
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>


    </div>
  );
};

export default UserMessage;
