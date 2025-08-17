'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UpdateItem {
  id: string;
  version: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  changes: string[];
  commitHash?: string;
}

interface RecentUpdatesProps {
  channelId: string;
}

// Mock data - in production this would come from an API
const mockUpdates: UpdateItem[] = [
  {
    id: '1',
    version: 'v2.1.0',
    title: 'Vitalik Reflects on Ethereum\'s 10-Year Journey',
    description: 'Comprehensive interview covering Ethereum\'s evolution from "world computer" to "world ledger" and future vision.',
    timestamp: new Date('2025-08-16T14:30:00Z'),
    type: 'major',
    changes: [
      'Discussed shift from "world computer" to "world ledger" focus',
      'Shared perspective on ETH treasury companies and leverage risks',
      'Emphasized privacy as core network value',
      'Outlined vision for next decade of development',
      'Addressed scalability and decentralization balance'
    ],
    commitHash: 'a7b3c9d'
  },
  {
    id: '2',
    version: 'v2.0.5',
    title: 'Ronin Network Migrates Back to Ethereum L2',
    description: 'Axie Infinity\'s Ronin Network announces migration back to Ethereum as Layer 2 solution.',
    timestamp: new Date('2025-08-15T09:15:00Z'),
    type: 'minor',
    changes: [
      'Ronin Network chooses Ethereum for enhanced security',
      'Migration demonstrates L2 ecosystem improvements',
      'Axie Infinity benefits from Ethereum\'s infrastructure',
      'Validates Ethereum\'s scalability solutions',
      'Strengthens gaming ecosystem on Ethereum'
    ],
    commitHash: 'f2e8a1b'
  },
  {
    id: '3',
    version: 'v2.0.0',
    title: 'Vitalik Explores AI and Cryptocurrency Intersection',
    description: 'Comprehensive blog post outlining four key areas where AI and crypto converge.',
    timestamp: new Date('2025-08-13T16:45:00Z'),
    type: 'minor',
    changes: [
      'AI as a player in crypto games and protocols',
      'AI as interface for improved user experience',
      'AI as rules engine for smart contracts',
      'AI as ultimate goal for decentralized systems',
      'Forward-thinking approach to technology evolution'
    ],
    commitHash: '9c4d7e2'
  },
  {
    id: '4',
    version: 'v1.9.8',
    title: 'SocialFi Gains Traction on Base Layer 2',
    description: 'Coinbase\'s Base network sees surge in Social Finance applications and user activity.',
    timestamp: new Date('2025-08-12T11:20:00Z'),
    type: 'minor',
    changes: [
      'Tokenized social interactions gaining popularity',
      'Content creation monetization through SocialFi',
      'Base network activity surge demonstrates L2 success',
      'Innovation in social finance applications',
      'Growing Ethereum L2 ecosystem diversity'
    ],
    commitHash: '3b9f5a8'
  },
  {
    id: '5',
    version: 'v1.9.0',
    title: 'Vitalik Buterin Reclaims Billionaire Status',
    description: 'ETH price surge pushes Vitalik\'s holdings back above $1 billion milestone.',
    timestamp: new Date('2025-08-09T13:10:00Z'),
    type: 'major',
    changes: [
      'ETH holdings surpass billion-dollar valuation',
      'Reflects broader Ethereum ecosystem growth',
      'Demonstrates long-term value creation',
      'Milestone attracts mainstream financial attention',
      'Validates Ethereum\'s fundamental strength'
    ],
    commitHash: '7e1c4d9'
  },
  {
    id: '6',
    version: 'v1.8.3',
    title: 'Ethereum Price Soars 51.68% in Monthly Rally',
    description: 'ETH reaches $4,486.75, significantly outpacing Bitcoin with market dominance climbing to 13.62%.',
    timestamp: new Date('2025-08-05T10:30:00Z'),
    type: 'major',
    changes: [
      'ETH price surge of 51.68% over the month',
      'Outperformed Bitcoin\'s modest 1.70% gain',
      'Market dominance increased to 13.62%',
      'Strong institutional and retail investor interest',
      'Positive regulatory environment driving growth'
    ],
    commitHash: '5f2a8c1'
  },
  {
    id: '7',
    version: 'v1.8.0',
    title: 'Pro-Crypto SEC Reforms Announced',
    description: 'U.S. Securities and Exchange Commission announces favorable regulatory reforms for cryptocurrency sector.',
    timestamp: new Date('2025-07-31T14:20:00Z'),
    type: 'major',
    changes: [
      'SEC announces comprehensive pro-crypto reforms',
      'Ethereum positioned as key U.S. financial infrastructure',
      'Regulatory clarity boosts institutional confidence',
      'Market reacts positively with immediate ETH gains',
      'Sets foundation for broader crypto adoption'
    ],
    commitHash: '8d3b7f4'
  },
  {
    id: '8',
    version: 'v1.7.2',
    title: 'Ethereum ETFs See Record $2.12B Daily Inflows',
    description: 'Historic single-day inflow of $2.12 billion into Ethereum ETFs, vastly exceeding Bitcoin\'s $138M.',
    timestamp: new Date('2025-07-21T08:45:00Z'),
    type: 'major',
    changes: [
      'Record-breaking $2.12 billion daily ETF inflows',
      'Significantly outpaced Bitcoin ETF performance',
      'Institutional confidence in Ethereum reaches new heights',
      'ETF success validates Ethereum investment thesis',
      'Sets stage for sustained bullish momentum'
    ],
    commitHash: '2a9c5e7'
  }
];

const getTypeColor = (type: UpdateItem['type']) => {
  return 'from-purple-500 to-indigo-500';
};

const getTypeIcon = (type: UpdateItem['type']) => {
  return <GitBranch className="w-3 h-3" />;
};

export default function RecentUpdates({ channelId }: RecentUpdatesProps) {
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());
  const [showPulse, setShowPulse] = useState(true);

  const toggleExpanded = (updateId: string) => {
    setExpandedUpdates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  // Stop pulsing after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200/60 rounded-xl shadow-sm backdrop-blur-sm flex flex-col">
      {/* Recent Updates Content */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="p-2">
          <div className="relative">
            {/* Main Timeline Line */}
            <div className="absolute left-4 top-0 bottom-4 w-0.5 bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-200" />
            
            {/* Recent Update Items */}
            <div className="space-y-3 pb-4">
            {mockUpdates.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex items-start space-x-3"
              >
                {/* Timeline Node */}
                <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getTypeColor(update.type)} shadow-md flex items-center justify-center text-white`}
                  >
                    {getTypeIcon(update.type)}
                  </motion.div>
                  
                  {/* Connection Line to Content */}
                  <div className="absolute top-4 left-8 w-3 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                </div>

                {/* Content Card */}
                <motion.div
                  whileHover={{ scale: 1.01, y: -1 }}
                  className={`flex-1 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 ${
                    index === 0 && showPulse 
                      ? 'border-2 border-purple-400' 
                      : index === 0 
                        ? 'border-2 border-purple-300' 
                        : 'border border-gray-200/60'
                  }`}
                  animate={index === 0 && showPulse ? {
                    borderColor: ['rgb(196 181 253)', 'rgb(147 51 234)', 'rgb(196 181 253)'],
                    boxShadow: [
                      '0 0 0 0 rgba(147, 51, 234, 0)',
                      '0 0 0 4px rgba(147, 51, 234, 0.2)',
                      '0 0 0 0 rgba(147, 51, 234, 0)'
                    ]
                  } : {}}
                  transition={index === 0 && showPulse ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : { duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="mb-2">
                    {/* Title and Date Row */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                        {update.title}
                      </h4>
                      
                      <div className="px-1.5 py-0.5 bg-purple-100 rounded text-purple-700 ml-2 flex-shrink-0">
                        <span className="text-xs font-medium">
                          {update.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Description Full Width */}
                    <p className="text-xs text-gray-600 leading-snug">
                      {update.description}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <div className="mb-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleExpanded(update.id)}
                      className="flex items-center space-x-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                    >
                      <span>View Details</span>
                      {expandedUpdates.has(update.id) ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </motion.button>
                    
                    {/* Expandable Changes List */}
                    <AnimatePresence>
                      {expandedUpdates.has(update.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">Key Updates:</div>
                            <ul className="space-y-1">
                              {update.changes.map((change, changeIndex) => (
                                <motion.li
                                  key={changeIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: changeIndex * 0.05 }}
                                  className="flex items-start space-x-2 text-xs text-gray-700"
                                >
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0" />
                                  <span className="leading-relaxed font-medium">{change}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              </motion.div>
            ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
