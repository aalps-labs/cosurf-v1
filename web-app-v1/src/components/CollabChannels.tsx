'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Clock, Hash, Heart } from 'lucide-react';

interface CollabChannelsProps {
  channelId?: string;
}

interface CollabChannel {
  id: string;
  name: string;
  handle: string;
  description: string;
  memberCount: number;
  repScore: number;
  isFollowing?: boolean;
  lastActivity: string;
  collaborationType: 'cross-post' | 'joint-research' | 'shared-audience' | 'partner';
  avatarUrl: string;
}

const CollabChannels: React.FC<CollabChannelsProps> = ({ channelId }) => {
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  // Mock data for collaborative channels with diverse avatars (people, robots, cartoons, anime, things)
  const recommendedChannels: CollabChannel[] = [
    {
      id: 'ch-1',
      name: 'Ethereum Research',
      handle: 'ethereum-research',
      description: 'Deep technical discussions on Ethereum protocol development and research',
      memberCount: 45200,
      repScore: 94,
      isFollowing: false,
      lastActivity: '2h ago',
      collaborationType: 'joint-research',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'ch-2',
      name: 'DeFi Builders',
      handle: 'defi-builders',
      description: 'Building the future of decentralized finance protocols',
      memberCount: 28900,
      repScore: 87,
      isFollowing: true,
      lastActivity: '4h ago',
      collaborationType: 'cross-post',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=defibuilders&size=150'
    },
    {
      id: 'ch-3',
      name: 'Zero Knowledge',
      handle: 'zero-knowledge',
      description: 'Advancing privacy and scalability through zero-knowledge proofs',
      memberCount: 18700,
      repScore: 91,
      isFollowing: false,
      lastActivity: '1h ago',
      collaborationType: 'shared-audience',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 'ch-4',
      name: 'Layer 2 Solutions',
      handle: 'layer2-solutions',
      description: 'Scaling Ethereum with rollups, sidechains, and state channels',
      memberCount: 33400,
      repScore: 89,
      isFollowing: true,
      lastActivity: '3h ago',
      collaborationType: 'partner',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=layer2&size=150'
    },
    {
      id: 'ch-5',
      name: 'Crypto Economics',
      handle: 'crypto-economics',
      description: 'Economic models and incentive mechanisms in blockchain systems',
      memberCount: 15600,
      repScore: 85,
      isFollowing: false,
      lastActivity: '6h ago',
      collaborationType: 'joint-research',
      avatarUrl: 'https://robohash.org/cryptoecon?set=set3&size=150x150'
    },
    {
      id: 'ch-6',
      name: 'Smart Contract Security',
      handle: 'smart-contract-security',
      description: 'Best practices and auditing for secure smart contract development',
      memberCount: 22100,
      repScore: 92,
      isFollowing: false,
      lastActivity: '5h ago',
      collaborationType: 'cross-post',
      avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=security&size=150'
    }
  ];





  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Initialize following states from channel data
  useEffect(() => {
    const initialStates: Record<string, boolean> = {};
    recommendedChannels.forEach(channel => {
      initialStates[channel.id] = channel.isFollowing || false;
    });
    setFollowingStates(initialStates);
  }, []);

  const handleFollowToggle = (channelId: string) => {
    setFollowingStates(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className="h-full"
    >
      <div className="h-full bg-gradient-to-br from-gray-50 to-purple-50/30 border border-gray-200/60 rounded-xl shadow-sm backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4 border-b border-gray-200/40">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg blur-sm opacity-20" />
              <Users className="w-5 h-5 text-purple-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">Collab Channels</h3>
          </div>
        </div>

        {/* Content Area - Scrollable Channels */}
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full overflow-y-auto pr-2 scrollbar-thin">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {recommendedChannels.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 200,
                      damping: 25
                    }}
                  >
                    <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4 hover:shadow-md hover:border-gray-300/60 transition-all duration-200 group cursor-pointer">
                      {/* Channel Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <img
                              src={channel.avatarUrl}
                              alt={channel.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                            />
                          </div>
                          
                          {/* Channel Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                              <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">
                                {channel.name}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">@{channel.handle}</p>
                          </div>
                        </div>
                        
                        <motion.button
                          onClick={() => handleFollowToggle(channel.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all duration-300 flex items-center gap-1 ${
                            followingStates[channel.id]
                              ? 'bg-white/20 text-gray-700 hover:bg-white/30 border border-gray-300'
                              : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                          }`}
                        >
                          {followingStates[channel.id] ? (
                            <>
                              <Heart className="w-3 h-3 fill-current" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3" />
                              <span>Follow</span>
                            </>
                          )}
                        </motion.button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {channel.description}
                      </p>

                      {/* Channel Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                            <span className="text-xs text-gray-600 font-medium">
                              {formatMemberCount(channel.memberCount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-gray-600 font-medium">
                              {channel.repScore}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                            <span className="text-xs text-gray-500">
                              {channel.lastActivity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {followingStates[channel.id] && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollabChannels;
