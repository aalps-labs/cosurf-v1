'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VersionUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  changes: string[];
  commitHash?: string;
}

interface VersionTimelineProps {
  channelId: string;
}

// Mock data - in production this would come from an API
const mockVersions: VersionUpdate[] = [
  {
    id: '1',
    version: 'v2.1.0',
    title: 'Enhanced Search Algorithm',
    description: 'Improved search relevance with semantic understanding and better ranking.',
    timestamp: new Date('2025-08-15T14:30:00Z'),
    type: 'minor',
    changes: [
      'Added semantic search capabilities with vector embeddings',
      'Improved result ranking algorithm using machine learning',
      'Enhanced query preprocessing with NLP tokenization',
      'Implemented real-time search suggestions',
      'Added support for fuzzy matching and typo correction'
    ],
    commitHash: 'a7b3c9d'
  },
  {
    id: '2',
    version: 'v2.0.5',
    title: 'Performance Optimizations',
    description: 'Critical performance improvements and bug fixes for better user experience.',
    timestamp: new Date('2025-08-12T09:15:00Z'),
    type: 'patch',
    changes: [
      'Reduced search latency by 40% through caching optimization',
      'Fixed memory leak in document processing pipeline',
      'Optimized database queries with proper indexing',
      'Implemented connection pooling for better resource management',
      'Added performance monitoring and alerting system'
    ],
    commitHash: 'f2e8a1b'
  },
  {
    id: '3',
    version: 'v2.0.0',
    title: 'Major Architecture Overhaul',
    description: 'Complete rewrite of the core engine with modern technologies and improved scalability.',
    timestamp: new Date('2025-08-08T16:45:00Z'),
    type: 'major',
    changes: [
      'Migrated to microservices architecture with Docker containers',
      'Implemented real-time indexing with Apache Kafka streams',
      'Added multi-language support for 15+ languages',
      'New user interface design with modern React components',
      'Introduced API versioning and backward compatibility',
      'Added comprehensive logging and distributed tracing'
    ],
    commitHash: '9c4d7e2'
  },
  {
    id: '4',
    version: 'v1.9.8',
    title: 'Security Patch',
    description: 'Critical security updates and vulnerability fixes.',
    timestamp: new Date('2025-08-05T11:20:00Z'),
    type: 'hotfix',
    changes: [
      'Fixed critical authentication bypass vulnerability (CVE-2025-1234)',
      'Updated all dependencies with latest security patches',
      'Enhanced input validation and sanitization across all endpoints',
      'Implemented rate limiting to prevent abuse',
      'Added security headers and CSRF protection'
    ],
    commitHash: '3b9f5a8'
  },
  {
    id: '5',
    version: 'v1.9.0',
    title: 'Analytics Dashboard',
    description: 'New analytics and reporting features for better insights.',
    timestamp: new Date('2025-08-01T13:10:00Z'),
    type: 'minor',
    changes: [
      'Added comprehensive analytics dashboard with real-time metrics',
      'Implemented detailed usage tracking and user behavior analysis',
      'Created custom report builder with export functionality',
      'Added data visualization charts and graphs',
      'Implemented A/B testing framework for feature experiments'
    ],
    commitHash: '7e1c4d9'
  },
  {
    id: '6',
    version: 'v1.8.3',
    title: 'Bug Fixes and Improvements',
    description: 'Various bug fixes and minor improvements for stability.',
    timestamp: new Date('2025-07-28T10:30:00Z'),
    type: 'patch',
    changes: [
      'Fixed search result pagination edge cases and infinite scroll',
      'Improved error handling with user-friendly error messages',
      'Updated UI components to latest design system standards',
      'Fixed responsive layout issues on mobile devices',
      'Optimized bundle size by removing unused dependencies'
    ],
    commitHash: '5f2a8c1'
  },
  {
    id: '7',
    version: 'v1.8.0',
    title: 'Multi-tenant Support',
    description: 'Added support for multiple organizations and improved user management.',
    timestamp: new Date('2025-07-22T14:20:00Z'),
    type: 'minor',
    changes: [
      'Implemented organization-based access control',
      'Added user role management',
      'Enhanced data isolation'
    ],
    commitHash: '8d3b7f4'
  },
  {
    id: '8',
    version: 'v1.7.2',
    title: 'Critical Security Fix',
    description: 'Emergency patch for security vulnerability.',
    timestamp: new Date('2025-07-18T08:45:00Z'),
    type: 'hotfix',
    changes: [
      'Fixed SQL injection vulnerability',
      'Updated authentication middleware',
      'Enhanced request validation'
    ],
    commitHash: '2a9c5e7'
  }
];

const getTypeColor = (type: VersionUpdate['type']) => {
  return 'from-purple-500 to-indigo-500';
};

const getTypeIcon = (type: VersionUpdate['type']) => {
  return <GitBranch className="w-3 h-3" />;
};



export default function VersionTimeline({ channelId }: VersionTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [showPulse, setShowPulse] = useState(true);

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
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
      {/* Timeline Content */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="p-2">
          <div className="relative">
            {/* Main Timeline Line */}
            <div className="absolute left-4 top-0 bottom-4 w-0.5 bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-200" />
            
            {/* Timeline Items */}
            <div className="space-y-3 pb-4">
            {mockVersions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex items-start space-x-3"
              >
                {/* Timeline Node */}
                <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getTypeColor(version.type)} shadow-md flex items-center justify-center text-white`}
                  >
                    {getTypeIcon(version.type)}
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
                        {version.title}
                      </h4>
                      
                      <div className="px-1.5 py-0.5 bg-purple-100 rounded text-purple-700 ml-2 flex-shrink-0">
                        <span className="text-xs font-medium">
                          {version.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Description Full Width */}
                    <p className="text-xs text-gray-600 leading-snug">
                      {version.description}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <div className="mb-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleExpanded(version.id)}
                      className="flex items-center space-x-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                    >
                      <span>View Details</span>
                      {expandedVersions.has(version.id) ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </motion.button>
                    
                    {/* Expandable Changes List */}
                    <AnimatePresence>
                      {expandedVersions.has(version.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">Changes:</div>
                            <ul className="space-y-1">
                              {version.changes.map((change, changeIndex) => (
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
