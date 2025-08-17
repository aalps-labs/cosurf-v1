'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Square, Sparkles } from 'lucide-react';

interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  onSend?: (message: string) => void;
  className?: string;
}

interface TrendingQuestion {
  id: string;
  question: string;
  askerHandle: string;
  likesCount: number;
}

export default function ChatInput({ 
  placeholder = "Ask anything about this channel...", 
  disabled = false,
  onSend,
  className = ""
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [positionAbove, setPositionAbove] = useState(false);
  const [wasActivelyClicked, setWasActivelyClicked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get trending questions from RecentlyAsked data (same mock data)
  const getTrendingQuestions = (): TrendingQuestion[] => {
    const trendingQuestions = [
      {
        id: '15',
        question: "Do you ever get tired of people asking you to explain blockchain at parties, and what's your go-to escape strategy?",
        askerHandle: 'partypete',
        likesCount: 456
      },
      {
        id: '19',
        question: "Do you have a secret stash of 'I told you so' tweets saved for when Ethereum hits $10k?",
        askerHandle: 'hodlhero',
        likesCount: 567
      },
      {
        id: '16',
        question: "If ETH was a Pokemon, what type would it be and what would its special attack be called?",
        askerHandle: 'pokemonmaster',
        likesCount: 678
      },
      {
        id: '20',
        question: "What's your honest reaction when people pronounce it 'Ether-EE-um' instead of 'Ether-EH-um'?",
        askerHandle: 'grammarpolice',
        likesCount: 789
      },
      {
        id: '14',
        question: "What's the most important thing developers building on Ethereum consistently get wrong?",
        askerHandle: 'devgarcia',
        likesCount: 289
      }
    ];

    // Sort by likes count descending to get top trending
    return trendingQuestions.sort((a, b) => b.likesCount - a.likesCount);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Check positioning for quick actions
  useEffect(() => {
    if (showQuickActions && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const quickActionsHeight = 200; // Approximate height of quick actions
      
      setPositionAbove(spaceBelow < quickActionsHeight);
    }
  }, [showQuickActions]);

  // Determine if quick actions should show
  useEffect(() => {
    const shouldShow = wasActivelyClicked && isFocused && !message.trim();
    setShowQuickActions(shouldShow);
  }, [wasActivelyClicked, isFocused, message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && onSend) {
      onSend(message.trim());
      setMessage('');
      // Keep focus but don't show quick actions after sending
      setWasActivelyClicked(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording logic
  };

  const handleFocus = () => {
    setIsFocused(true);
    setWasActivelyClicked(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding quick actions to allow for clicks
    setTimeout(() => {
      setWasActivelyClicked(false);
    }, 150);
  };

  const handleQuickActionClick = (action: string) => {
    setMessage(action);
    setWasActivelyClicked(false);
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative ${className}`}
    >


      {/* Main Input Container */}
      <motion.div
        animate={{
          boxShadow: isFocused 
            ? '0 0 0 1px rgba(99, 102, 241, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(99, 102, 241, 0.06)' 
            : '0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl overflow-hidden backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="flex items-center">
          {/* Attachment Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 p-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>

          {/* Text Input Area */}
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full py-3 px-0 text-gray-900 placeholder-gray-400 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-sm leading-6 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
              style={{ minHeight: '44px', lineHeight: '20px' }}
            />
            
            {/* Character count for long messages */}
            <AnimatePresence>
              {message.length > 200 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-1 right-2 text-xs text-gray-400"
                >
                  {message.length}/1000
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex items-center space-x-1 p-2">
            {/* Voice Recording Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              disabled={disabled}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center justify-center"
                  >
                    <Square className="w-4 h-4" fill="currentColor" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center justify-center"
                  >
                    <Mic className="w-4 h-4" strokeWidth={1.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Send Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: message.trim() ? 1.05 : 1 }}
              whileTap={{ scale: message.trim() ? 0.95 : 1 }}
              disabled={!message.trim() || disabled}
              className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                message.trim() && !disabled
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </motion.button>
          </div>
        </form>

        {/* Recording Indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  />
                  <span className="text-sm text-red-600 font-medium">Recording...</span>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 16, 4] }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-red-400 rounded-full"
                        style={{ height: 4 }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={toggleRecording}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Actions and Trending Questions */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: positionAbove ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: positionAbove ? -10 : 10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className={`absolute left-0 right-0 z-10 ${
              positionAbove 
                ? 'bottom-full mb-2' 
                : 'top-full mt-2'
            }`}
          >
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              <div className="flex">
                {/* Left Half - Top 3 Trending Questions */}
                <div className="flex-1 p-3">
                  <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Trending</div>
                  <div className="space-y-2">
                    {getTrendingQuestions().slice(0, 3).map((question, index) => (
                      <motion.button
                        key={question.id}
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(99, 102, 241, 0.02)" }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleQuickActionClick(question.question)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                      >
                        <div className="text-xs text-gray-700 line-clamp-2 group-hover:text-gray-900">
                          {question.question}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">@{question.askerHandle}</span>
                          <span className="text-xs text-gray-400">{question.likesCount} likes</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Vertical Separator */}
                <div className="w-px bg-gray-200"></div>

                {/* Right Half - Quick Actions */}
                <div className="flex-1 p-3">
                  <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Quick Actions</div>
                  <div className="space-y-2">
                    {[
                      { label: "Summarize content", icon: "📄", action: "Summarize this channel" },
                      { label: "Find documents", icon: "🔍", action: "Find relevant documents" },
                      { label: "Ask about updates", icon: "🔄", action: "Show recent updates" },
                      { label: "Get insights", icon: "💡", action: "Get key insights" }
                    ].map((item, index) => (
                      <motion.button
                        key={item.label}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(99, 102, 241, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickActionClick(item.action)}
                        className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
