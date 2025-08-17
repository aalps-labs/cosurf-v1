'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Clock, X } from 'lucide-react';
import type { ChatSession } from '../hooks/useChatHistory';

interface ChatHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: ChatSession | null;
  recentSessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatHistoryPopup({
  isOpen,
  onClose,
  currentSession,
  recentSessions,
  onLoadSession,
  onDeleteSession
}: ChatHistoryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Check if the click is on the chat history button itself
        const target = event.target as Element;
        const isHistoryButton = target.closest('[title="Chat History"]');
        if (!isHistoryButton) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-gray-800">Chat History</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-300 mb-3" strokeWidth={1} />
                  <h4 className="text-sm font-medium text-gray-500 mb-1">No chat history</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Start a new conversation to see your chat history here.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  <AnimatePresence>
                    {recentSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                          currentSession?.id === session.id
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => {
                          onLoadSession(session.id);
                          onClose();
                        }}
                      >
                        {/* Session Content */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className={`text-sm font-medium truncate ${
                              currentSession?.id === session.id
                                ? 'text-indigo-700'
                                : 'text-gray-700 group-hover:text-indigo-600'
                            }`}>
                              {session.title}
                            </h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                              <span className="text-xs text-gray-500">
                                {formatTime(session.updatedAt)}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {session.messages.length} messages
                              </span>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all duration-200"
                          >
                            <Trash2 className="w-3 h-3" strokeWidth={2} />
                          </motion.button>
                        </div>

                        {/* Active Session Indicator */}
                        {currentSession?.id === session.id && (
                          <motion.div
                            layoutId="activeSessionPopup"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
