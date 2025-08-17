'use client';

import React, { useState, useRef, useEffect } from 'react';
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
    deleteSession,
    isLoaded
  } = useChatHistory(channelId);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fixed model - Gemini 2.5 Flash
  const selectedModel = 'gemini-2.5-flash';

  // Initialize with a new session if none exists after loading is complete
  useEffect(() => {
    if (isLoaded && !currentSession) {
      console.log('📝 Creating new session after loading complete');
      createNewSession(channelId, channelName);
    }
  }, [isLoaded, currentSession, createNewSession, channelId, channelName]);

  const messages = currentSession?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  // Cleanup function to stop streaming
  const stopStreaming = () => {
    if (abortControllerRef.current) {
      console.log('🛑 Stopping AI response generation');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    setIsAssistantTyping(false);
  };

  // Cleanup on component unmount or channel change
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [channelId]);

  // Set timeout for streaming (30 seconds max)
  const setStreamingTimeout = () => {
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    streamingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Streaming timeout reached, stopping generation');
      stopStreaming();
    }, 30000); // 30 second timeout
  };

  // Helper function to extract domain from URL
  const getDomainFromUrl = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };



  const handleSendMessage = async (content: string) => {
    if (!currentSession || isAssistantTyping) return;

    // Stop any existing streaming
    stopStreaming();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    updateSession(currentSession.id, updatedMessages);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsAssistantTyping(true);

    setStreamingTimeout();

    try {
      // Create assistant message with streaming placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        sender: 'assistant',
        timestamp: new Date(),
        isTyping: true
      };

      const messagesWithAssistant = [...updatedMessages, assistantMessage];
      updateSession(currentSession.id, messagesWithAssistant);

      // Step 1: Perform RAG search using documents API
      let enhancedPrompt = content;
      let documentReferences: any[] = [];

      try {
        console.log('🔍 CHAT INTERFACE: Starting RAG search for:', content);
        
        // Call documents RAG search API
        const ragResponse = await fetch('/api/v1/documents/rag-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel_id: channelId,
            query: content,
            top_k: 15,
            similarity_threshold: 0.1,
            context_window: 2,
            include_content: false,
            include_source: true
          }),
          signal: abortControllerRef.current?.signal
        });

        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          console.log('✅ CHAT INTERFACE: RAG search successful, found', ragData.results?.length || 0, 'relevant chunks');

          if (ragData.success && ragData.results && ragData.results.length > 0) {
            // Create chat history context (last 6 messages for context)
            const recentMessages = messages.slice(-6);
            let chatHistoryContext = '';
            
            if (recentMessages.length > 0) {
              chatHistoryContext = `
Previous Conversation:
${recentMessages.map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

`;
            }

            // Build enhanced prompt with document context
            const documentContext = ragData.results.map((result: any, index: number) => {
              const chunk = result.chunk;
              const document = result.document;
              const similarity = Math.round(result.similarityScore * 100);
              const referenceNumber = index + 1;
              
              // Get chunk text content (truncate if too long for prompt)
              const chunkText = chunk?.text || 'No content available';
              const truncatedText = chunkText.length > 1500 
                ? chunkText.substring(0, 1500) + '...' 
                : chunkText;
              
              return `
Source ${referenceNumber}:
Title: ${document.title}
URL: ${document.canonicalUrl || '#'}
Type: ${document.docType}
Similarity: ${similarity}%
Content:
${truncatedText}
---`;
            }).join('\n');

            enhancedPrompt = `${chatHistoryContext}Context: I have access to the following relevant content from the user's knowledge base:

${documentContext}

Current User Question: ${content}

Instructions:
1. PRIORITY: If the user specifies a format, length, or style in their question, follow their instructions exactly
2. Give the answer in the same language as the user's question
3. Provide a clear, helpful response that directly addresses what the user is asking
4. Use the provided sources when relevant and cite them with numbered references [1], [2], etc.
5. Format your response appropriately - use markdown headings, bullet points, or lists when they improve clarity
6. Keep responses focused and well-structured - avoid unnecessary verbosity unless the user specifically requests detailed analysis
7. Place references immediately after the relevant information
8. Only reference sources you actually use in your answer
9. If the user asks for a brief answer, keep it concise; if they ask for detailed analysis, provide comprehensive coverage
10. Consider the conversation context when answering

Example reference format: 
- Single source: "According to the research [1], this approach is effective."
- Multiple sources: "Recent studies [1] [2] show significant improvements in this area."`;

            // Prepare document references for display
            documentReferences = ragData.results.map((result: any, index: number) => ({
              id: result.chunk?.id || `chunk-${index}`,
              title: result.document?.title || 'Untitled',
              url: result.document?.canonicalUrl || '#',
              similarity: Math.round(result.similarityScore * 100),
              docType: result.document?.docType || 'UNKNOWN',
              favicon: result.document?.favicon,
              domain: result.document?.canonicalUrl ? getDomainFromUrl(result.document.canonicalUrl) : undefined
            }));

            console.log('📚 CHAT INTERFACE: Prepared', documentReferences.length, 'document references');
            

          } else {
            // No documents found, but check if we have chat history
            const recentMessages = messages.slice(-6);
            if (recentMessages.length > 0) {
              const chatHistoryContext = `
Previous Conversation:
${recentMessages.map((msg: Message) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

`;

              enhancedPrompt = `${chatHistoryContext}

Current User Question: ${content}

Instructions:
1. PRIORITY: If the user specifies a format, length, or style in their question, follow their instructions exactly
2. Give the answer in the same language as the user's question
3. Provide a clear, helpful response that directly addresses what the user is asking
4. Consider the previous conversation context when answering
5. Format your response appropriately - use markdown headings, bullet points, or lists when they improve clarity
6. Keep responses focused and well-structured - avoid unnecessary verbosity unless the user specifically requests detailed analysis
7. If the user asks for a brief answer, keep it concise; if they ask for detailed analysis, provide comprehensive coverage
8. Be direct and practical - focus on answering the specific question asked`;
            }
          }
        } else {
          console.warn('⚠️ CHAT INTERFACE: RAG search failed with status:', ragResponse.status);
        }
      } catch (ragError) {
        console.error('❌ CHAT INTERFACE: RAG search error:', ragError);
        // Continue with basic prompt if RAG fails
        enhancedPrompt = `You are a helpful AI assistant. Answer the user's question clearly and appropriately.

User Question: ${content}

Instructions:
1. PRIORITY: If the user specifies a format, length, or style in their question, follow their instructions exactly
2. Give the answer in the same language as the user's question
3. Provide a clear, helpful response that directly addresses what the user is asking
4. Format your response appropriately - use markdown when it improves clarity
5. Keep responses focused and well-structured - avoid unnecessary verbosity unless specifically requested
6. Be direct and practical - focus on answering the specific question asked`;
      }

      // Add references to assistant message if we have them
      if (documentReferences.length > 0) {
        console.log('📚 CHAT INTERFACE: Adding', documentReferences.length, 'references to AI message');

        // Update AI message with references
        const messagesWithReferences = messagesWithAssistant.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, references: documentReferences }
            : msg
        );
        updateSession(currentSession.id, messagesWithReferences);
      }

      // Step 2: Call streaming API with enhanced prompt
      console.log('🤖 CHAT INTERFACE: Calling streaming API with enhanced prompt');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model: selectedModel,
          temperature: 0.7,
          stream: true
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('0:')) {
            try {
              const content = JSON.parse(line.slice(2));
              accumulatedContent += content;



              // Update the assistant message with accumulated content
              const currentMessages = [...updatedMessages];
              const assistantIndex = currentMessages.findIndex(msg => msg.id === assistantMessageId);
              
              if (assistantIndex === -1) {
                currentMessages.push({
                  id: assistantMessageId,
                  content: accumulatedContent,
                  sender: 'assistant',
                  timestamp: new Date(),
                  isTyping: true,
                  references: documentReferences.length > 0 ? documentReferences : undefined
                });
              } else {
                currentMessages[assistantIndex] = {
                  ...currentMessages[assistantIndex],
                  content: accumulatedContent,
                  isTyping: true,
                  references: documentReferences.length > 0 ? documentReferences : undefined
                };
              }

              updateSession(currentSession.id, currentMessages);
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Mark streaming as complete and cleanup
      const finalMessages = [...updatedMessages];
      const assistantIndex = finalMessages.findIndex(msg => msg.id === assistantMessageId);
      
      if (assistantIndex !== -1) {
        finalMessages[assistantIndex] = {
          ...finalMessages[assistantIndex],
          content: accumulatedContent,
          isTyping: false,
          references: documentReferences.length > 0 ? documentReferences : undefined
        };
      } else {
        finalMessages.push({
          id: assistantMessageId,
          content: accumulatedContent,
          sender: 'assistant',
          timestamp: new Date(),
          isTyping: false,
          references: documentReferences.length > 0 ? documentReferences : undefined
        });
      }

      updateSession(currentSession.id, finalMessages);
      

      
      // Clean up streaming state
      setIsAssistantTyping(false);
      abortControllerRef.current = null;
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }

    } catch (error) {
      // Clean up streaming state
      setIsAssistantTyping(false);
      abortControllerRef.current = null;
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }

      // Handle different types of errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Request was aborted by user');
        // Don't show error message for user-initiated stops
        return;
      }

      console.error('Error calling chat API:', error);
      
      // Add error message for actual errors
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `Sorry, I encountered an error while processing your request. Please try again.`,
        sender: 'assistant',
        timestamp: new Date()
      };

      const errorMessages = [...updatedMessages, errorMessage];
      updateSession(currentSession.id, errorMessages);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
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
    
    // Trigger new streaming response for the edited message
    await handleSendMessage(newContent);
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
        className={`flex-1 overflow-y-auto px-6 pt-8 pb-4 relative min-h-0 ${
          showHistoryPopup ? 'after:absolute after:inset-0 after:bg-black/10 after:backdrop-blur-sm after:z-30' : ''
        }`}
      >
        <AnimatePresence>
          {messages.map((message, index) => {
            return (
              <React.Fragment key={message.id}>
                <motion.div
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
                        isStreaming: message.isTyping,
                        references: message.references?.map(ref => ({
                          id: ref.id,
                          title: ref.title,
                          url: ref.url,
                          similarity: ref.similarity
                        }))
                      }}

                    />
                  )}
                </motion.div>


              </React.Fragment>
            );
          })}
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
              onStop={stopStreaming}
              isGenerating={isAssistantTyping}
              disabled={false}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
