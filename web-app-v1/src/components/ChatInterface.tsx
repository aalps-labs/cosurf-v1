'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ChatInput from './ChatInput';
import AiMessage from './AiMessage';
import UserMessage from './UserMessage';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      content: `I recently found some interesting updates about ${channelName}. What would you like to explore or discuss?`,
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
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

  const handleEditMessage = (messageId: string, newContent: string) => {
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
    setMessages([...updatedMessages, editedMessage]);
    setIsAssistantTyping(true);

    // Generate new AI response for the edited message
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `I understand you're asking about "${newContent}". This is a simulated response for channel ${channelName}. In a real implementation, this would connect to your AI backend to provide contextual answers based on the channel's content.`,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
    }, 1500);
  };



  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 pt-8 pb-4"
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
