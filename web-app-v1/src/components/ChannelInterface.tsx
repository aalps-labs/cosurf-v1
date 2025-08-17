'use client';

import { motion } from 'framer-motion';
import ChatInput from './ChatInput';
import ChannelDescription from './ChannelDescription';
import RecentlyAsked from './RecentlyAsked';

interface ChannelInfo {
  id: string;
  name: string;
  channel_handle: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  followers_count: number;
  rep_score: number;
  user_id: string;
}

interface ChannelInterfaceProps {
  channelId: string;
  channelInfo: ChannelInfo | null;
  loading?: boolean;
  onChatMessage?: (message: string) => void;
  className?: string;
}

export default function ChannelInterface({
  channelId,
  channelInfo,
  loading = false,
  onChatMessage,
  className = ""
}: ChannelInterfaceProps) {
  
  const handleChatMessage = (message: string) => {
    console.log('Chat message:', message);
    if (onChatMessage) {
      onChatMessage(message);
    }
    // TODO: Implement chat logic or switch to chat interface
  };

  return (
    <div className={`flex-1 p-8 flex flex-col space-y-6 min-h-[76vh] max-h-[76vh] overflow-y-auto ${className}`}>
      {/* Chat Input Section */}
      {channelInfo && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ChatInput 
            placeholder={`Ask anything about ${channelInfo.name}...`}
            onSend={handleChatMessage}
          />
        </motion.div>
      )}

      {/* Channel Description Section */}
      {channelInfo?.description && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <ChannelDescription description={channelInfo.description} />
        </motion.div>
      )}

      {/* Bottom Section - Split Content with Fixed Height */}
      {channelInfo && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="h-[32rem] flex space-x-6"
        >
          {/* Left Half - Recently Asked */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex-1"
          >
            <RecentlyAsked channelId={channelId} />
          </motion.div>

          {/* Right Half - Empty Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex-1"
          >
            {/* Empty div for future content */}
          </motion.div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading channel content...</p>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!channelInfo && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-gray-500">Channel not found</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
