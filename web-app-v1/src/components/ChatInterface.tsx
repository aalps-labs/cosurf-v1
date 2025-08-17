'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Sparkles } from 'lucide-react';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsAssistantTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I understand you're asking about "${content}". This is a simulated response for channel ${channelName}. In a real implementation, this would connect to your AI backend to provide contextual answers based on the channel's content.`,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
    }, 1500);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Add toast notification
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg blur-sm opacity-20" />
              <Sparkles className="w-5 h-5 text-indigo-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chat with {channelName}</h2>
              <p className="text-sm text-gray-500">Ask questions about this channel's content</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">AI Assistant Online</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-lg opacity-20" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-md">
                Ask me anything about {channelName}. I can help you understand the content, 
                find specific information, or provide insights based on the channel's documents.
              </p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                        : 'bg-gradient-to-br from-gray-600 to-gray-800'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4 text-white" strokeWidth={2} />
                      ) : (
                        <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Message Actions */}
                    <div className={`flex items-center space-x-2 mt-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                      
                      {message.sender === 'assistant' && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyMessage(message.content)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Copy message"
                          >
                            <Copy className="w-3 h-3" strokeWidth={2} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-green-600 rounded"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3 h-3" strokeWidth={2} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Poor response"
                          >
                            <ThumbsDown className="w-3 h-3" strokeWidth={2} />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isAssistantTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="flex space-x-3 max-w-4xl">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                  </div>
                </div>
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
        className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white"
      >
        <ChatInput
          placeholder={`Ask anything about ${channelName}...`}
          onSend={handleSendMessage}
          disabled={isAssistantTyping}
        />
      </motion.div>
    </div>
  );
}
