'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Share, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface QuestionCardProps {
  id: string;
  question: string;
  askerName: string;
  askerHandle: string;
  askerAvatar: string;
  askedTime: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isNew?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  id,
  question,
  askerName,
  askerHandle,
  askerAvatar,
  askedTime,
  likesCount,
  repliesCount,
  isLiked = false,
  isNew = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const generateAvatarUrl = (name: string, seed?: string) => {
    const seedParam = seed ? `&seed=${seed}` : '';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff&size=40&font-size=0.4&bold=true${seedParam}`;
  };

  // Show only 2 lines by default (approximately 120 characters)
  const maxChars = 120;
  const isLongQuestion = question.length > maxChars;
  const displayQuestion = isLongQuestion && !isExpanded 
    ? question.substring(0, maxChars) + '...' 
    : question;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
    >
      {/* Header - Asker Info */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="relative">
          <img
            src={askerAvatar || generateAvatarUrl(askerName, askerHandle)}
            alt={askerName}
            className="w-8 h-8 rounded-full border border-gray-200"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">{askerName}</span>
            <span className="text-xs text-gray-500">@{askerHandle}</span>
            {isNew && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm"
              >
                New!
              </motion.div>
            )}
          </div>
          {askedTime && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{askedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-4">
        <p className="text-gray-800 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
          {displayQuestion}
        </p>
        
        {/* View More/Less Button */}
        {isLongQuestion && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <span>{isExpanded ? 'View less' : 'View more'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" strokeWidth={2} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            )}
          </motion.button>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Likes */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span className="text-xs font-medium">{likesCount}</span>
          </motion.button>

          {/* Replies */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-medium">{repliesCount}</span>
          </motion.button>

          {/* Share */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
          >
            <Share className="w-4 h-4" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionCard;
