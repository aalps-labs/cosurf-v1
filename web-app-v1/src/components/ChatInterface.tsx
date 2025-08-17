'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, List, Plus } from 'lucide-react';
import ChatInput from './ChatInput';
import AiMessage from './AiMessage';
import UserMessage from './UserMessage';
import ChatHistoryPopup from './ChatHistoryPopup';
import { useChatHistory, type Message } from '../hooks/useChatHistory';

interface ChatInterfaceProps {
  channelId: string;
  channelName?: string;
  className?: string;
}

export default function ChatInterface({ 
  channelId, 
  channelName = "Channel",
  className = "" 
}: ChatInterfaceProps) {
  const { 
    currentSession, 
    recentSessions,
    updateSession, 
    createNewSession,
    loadSession,
    deleteSession
  } = useChatHistory(channelId);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with a new session if none exists
  useEffect(() => {
    if (!currentSession) {
      createNewSession(channelId, channelName);
    }
  }, [currentSession, createNewSession, channelId, channelName]);

  const messages = currentSession?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    updateSession(currentSession.id, updatedMessages);
    setIsAssistantTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I understand you're asking about "${content}". This is a simulated response for channel ${channelName}. In a real implementation, this would connect to your AI backend to provide contextual answers based on the channel's content.`,
        sender: 'assistant',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      updateSession(currentSession.id, finalMessages);
      setIsAssistantTyping(false);
    }, 1500);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentSession) return;

    // Find the index of the message being edited
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages after the edited message (including AI responses)
    const updatedMessages = messages.slice(0, messageIndex);
    
    // Update the edited message
    const editedMessage = {
      ...messages[messageIndex],
      content: newContent
    };

    // Set the new message list and trigger new AI response
    const messagesWithEdit = [...updatedMessages, editedMessage];
    updateSession(currentSession.id, messagesWithEdit);
    setIsAssistantTyping(true);

    // Generate new AI response for the edited message
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I understand you're asking about "${newContent}". This is a simulated response for channel ${channelName}. In a real implementation, this would connect to your AI backend to provide contextual answers based on the channel's content.`,
        sender: 'assistant',
        timestamp: new Date()
      };

      const finalMessages = [...messagesWithEdit, assistantMessage];
      updateSession(currentSession.id, finalMessages);
      setIsAssistantTyping(false);
    }, 1500);
  };

  // Handle new chat creation
  const handleNewChat = () => {
    createNewSession(channelId, channelName);
    setShowHistoryPopup(false);
  };

  // Handle loading a specific chat session
  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId);
  };

  // Handle deleting a chat session
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto px-6 pt-8 pb-4 max-h-[72vh] relative ${
          showHistoryPopup ? 'after:absolute after:inset-0 after:bg-black/10 after:backdrop-blur-sm after:z-30' : ''
        }`}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {message.sender === 'user' ? (
                <UserMessage message={message} onEdit={handleEditMessage} />
              ) : (
                <AiMessage 
                  message={{
                    id: message.id,
                    content: message.content,
                    timestamp: message.timestamp.toISOString(),
                    isStreaming: message.isTyping
                  }} 
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isAssistantTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white relative"
      >
        <div className="flex items-end space-x-3">
          {/* Action Icons */}
          <div className="flex items-center space-x-2 pb-2 relative">
            {/* Chat History Button */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(99, 102, 241, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistoryPopup(!showHistoryPopup)}
              className={`p-2 rounded-lg transition-all duration-200 border ${
                showHistoryPopup
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border-transparent hover:border-indigo-200/50'
              }`}
              title="Chat History"
            >
              <List className="w-5 h-5" strokeWidth={2} />
            </motion.button>

            {/* Chat History Popup */}
            <ChatHistoryPopup
              isOpen={showHistoryPopup}
              onClose={() => setShowHistoryPopup(false)}
              currentSession={currentSession}
              recentSessions={recentSessions}
              onLoadSession={handleLoadSession}
              onDeleteSession={handleDeleteSession}
            />

            {/* New Chat Button */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(99, 102, 241, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-all duration-200 border border-transparent hover:border-indigo-200/50"
              title="New Chat"
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
            </motion.button>
          </div>

          {/* Chat Input */}
          <div className="flex-1">
            <ChatInput
              placeholder={`Ask anything about ${channelName}...`}
              onSend={handleSendMessage}
              disabled={isAssistantTyping}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
