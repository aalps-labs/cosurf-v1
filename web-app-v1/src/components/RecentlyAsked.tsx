'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import QuestionCard from './QuestionCard';

interface RecentlyAskedProps {
  channelId?: string;
}

interface Question {
  id: string;
  question: string;
  askerName: string;
  askerHandle: string;
  askerAvatar: string;
  askedTime: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  addedAt?: Date; // For real-time tracking
}

const RecentlyAsked: React.FC<RecentlyAskedProps> = ({ channelId }) => {
  const [mode, setMode] = useState<'trending' | 'realtime'>('trending');
  const [realtimeQuestions, setRealtimeQuestions] = useState<Question[]>([]);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [newestQuestionTime, setNewestQuestionTime] = useState<Date | null>(null);

  // Mock data for Vitalik's channel questions - mixed order, 2-line display
  const trendingQuestions: Question[] = [
    {
      id: '15',
      question: "Do you ever get tired of people asking you to explain blockchain at parties, and what's your go-to escape strategy?",
      askerName: 'Party Pete',
      askerHandle: 'partypete',
      askerAvatar: '',
      askedTime: '4d ago',
      likesCount: 456,
      repliesCount: 123,
      isLiked: true
    },
    {
      id: '3',
      question: "How do you envision Ethereum competing with quantum computing threats in the next decade?",
      askerName: 'Marcus Johnson',
      askerHandle: 'quantumdev',
      askerAvatar: '',
      askedTime: '6h ago',
      likesCount: 89,
      repliesCount: 23,
      isLiked: false
    },
    {
      id: '19',
      question: "Do you have a secret stash of 'I told you so' tweets saved for when Ethereum hits $10k?",
      askerName: 'HODL Hero',
      askerHandle: 'hodlhero',
      askerAvatar: '',
      askedTime: '6d ago',
      likesCount: 567,
      repliesCount: 145,
      isLiked: true
    },
    {
      id: '7',
      question: "How close are we to Ethereum being truly 'finished' - and what does that even mean to you?",
      askerName: 'James Miller',
      askerHandle: 'jameseth',
      askerAvatar: '',
      askedTime: '1d ago',
      likesCount: 134,
      repliesCount: 28,
      isLiked: false
    },
    {
      id: '16',
      question: "If ETH was a Pokemon, what type would it be and what would its special attack be called?",
      askerName: 'Pokemon Master',
      askerHandle: 'pokemonmaster',
      askerAvatar: '',
      askedTime: '4d ago',
      likesCount: 678,
      repliesCount: 187,
      isLiked: false
    },
    {
      id: '1',
      question: "What's the biggest misconception people have about Ethereum's future that keeps you up at night?",
      askerName: 'Alex Chen',
      askerHandle: 'alexdev',
      askerAvatar: '',
      askedTime: '2h ago',
      likesCount: 42,
      repliesCount: 8,
      isLiked: false
    },
    {
      id: '12',
      question: "What's your take on the environmental criticism of blockchain - is Proof of Stake enough?",
      askerName: 'Green Martinez',
      askerHandle: 'greencrypto',
      askerAvatar: '',
      askedTime: '3d ago',
      likesCount: 234,
      repliesCount: 76,
      isLiked: true
    },
    {
      id: '18',
      question: "If you had to explain Ethereum using only food metaphors, what would you say?",
      askerName: 'Foodie Crypto',
      askerHandle: 'foodiecrypto',
      askerAvatar: '',
      askedTime: '5d ago',
      likesCount: 234,
      repliesCount: 67,
      isLiked: false
    },
    {
      id: '5',
      question: "Which current Ethereum competitor do you secretly respect the most and why?",
      askerName: 'David Park',
      askerHandle: 'blockchainpark',
      askerAvatar: '',
      askedTime: '12h ago',
      likesCount: 203,
      repliesCount: 67,
      isLiked: false
    },
    {
      id: '20',
      question: "What's your honest reaction when people pronounce it 'Ether-EE-um' instead of 'Ether-EH-um'?",
      askerName: 'Grammar Police',
      askerHandle: 'grammarpolice',
      askerAvatar: '',
      askedTime: '1w ago',
      likesCount: 789,
      repliesCount: 234,
      isLiked: false
    },
    {
      id: '8',
      question: "What's your biggest fear about how governments might try to regulate Ethereum?",
      askerName: 'Anna Thompson',
      askerHandle: 'annaregulation',
      askerAvatar: '',
      askedTime: '1d ago',
      likesCount: 267,
      repliesCount: 89,
      isLiked: true
    },
    {
      id: '11',
      question: "How do you balance decentralization ideals with the practical need for leadership and direction?",
      askerName: 'Robert Wilson',
      askerHandle: 'robdecentralized',
      askerAvatar: '',
      askedTime: '2d ago',
      likesCount: 187,
      repliesCount: 43,
      isLiked: false
    },
    {
      id: '4',
      question: "What's your honest take on whether DeFi will actually replace traditional banking, or just complement it?",
      askerName: 'Emma Rodriguez',
      askerHandle: 'defiemma',
      askerAvatar: '',
      askedTime: '8h ago',
      likesCount: 156,
      repliesCount: 34,
      isLiked: true
    },
    {
      id: '17',
      question: "What's the most ridiculous thing someone has offered to trade you for ETH, and did you consider it?",
      askerName: 'Trade King',
      askerHandle: 'tradeking',
      askerAvatar: '',
      askedTime: '5d ago',
      likesCount: 345,
      repliesCount: 89,
      isLiked: true
    },
    {
      id: '9',
      question: "If Ethereum fails, what do you think will be the primary reason?",
      askerName: 'Michael Brown',
      askerHandle: 'mikecritical',
      askerAvatar: '',
      askedTime: '2d ago',
      likesCount: 145,
      repliesCount: 52,
      isLiked: false
    },
    {
      id: '14',
      question: "What's the most important thing developers building on Ethereum consistently get wrong?",
      askerName: 'Dev Garcia',
      askerHandle: 'devgarcia',
      askerAvatar: '',
      askedTime: '3d ago',
      likesCount: 289,
      repliesCount: 94,
      isLiked: true
    },
    {
      id: '2',
      question: "If you could go back to 2013, what would you tell your younger self about building Ethereum differently?",
      askerName: 'Sarah Kim',
      askerHandle: 'sarahcrypto',
      askerAvatar: '',
      askedTime: '4h ago',
      likesCount: 67,
      repliesCount: 15,
      isLiked: true
    },
    {
      id: '10',
      question: "What's the weirdest or most unexpected use case you've seen built on Ethereum?",
      askerName: 'Sophie Davis',
      askerHandle: 'sophieweird',
      askerAvatar: '',
      askedTime: '2d ago',
      likesCount: 98,
      repliesCount: 31,
      isLiked: true
    },
    {
      id: '13',
      question: "Which traditional industry do you think Ethereum will disrupt next that people aren't talking about?",
      askerName: 'Future Lee',
      askerHandle: 'futurelee',
      askerAvatar: '',
      askedTime: '3d ago',
      likesCount: 156,
      repliesCount: 38,
      isLiked: false
    },
    {
      id: '6',
      question: "What's the most controversial decision you've made for Ethereum that you still stand by?",
      askerName: 'Lisa Wang',
      askerHandle: 'lisacrypto',
      askerAvatar: '',
      askedTime: '1d ago',
      likesCount: 178,
      repliesCount: 45,
      isLiked: true
    }
  ];

  // Real-time questions pool for rotation
  const realtimeQuestionsPool: Question[] = [
    {
      id: 'rt-1',
      question: "What are your thoughts on the recent EIP-4844 implementation and its impact on L2 scaling solutions?",
      askerName: 'Sarah Chen',
      askerHandle: 'sarahdev',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-2',
      question: "How do you see account abstraction changing the user experience for mainstream adoption?",
      askerName: 'Alex Rodriguez',
      askerHandle: 'alextech',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-3',
      question: "What's your perspective on the current state of MEV and its long-term implications for Ethereum?",
      askerName: 'Dr. Emily Wang',
      askerHandle: 'emilywang',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-4',
      question: "How should developers approach building applications that can handle Ethereum's evolving consensus mechanism?",
      askerName: 'Marcus Thompson',
      askerHandle: 'marcusdev',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-5',
      question: "What role do you see ZK-rollups playing in Ethereum's long-term scalability roadmap?",
      askerName: 'Dr. Lisa Park',
      askerHandle: 'lisapark',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-6',
      question: "What are the key considerations for implementing cross-chain interoperability in DeFi protocols?",
      askerName: 'David Kim',
      askerHandle: 'davidkim',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-7',
      question: "How do you evaluate the trade-offs between decentralization and performance in Layer 2 solutions?",
      askerName: 'Prof. Michael Lee',
      askerHandle: 'proflee',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-8',
      question: "What's your assessment of the current validator economics and staking centralization risks?",
      askerName: 'Dr. Anna Martinez',
      askerHandle: 'annamartinez',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-9',
      question: "How should enterprises approach integrating Ethereum into their existing financial infrastructure?",
      askerName: 'James Wilson',
      askerHandle: 'jameswilson',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-10',
      question: "What are the most promising developments in zero-knowledge proof technology for Ethereum?",
      askerName: 'Dr. Rachel Green',
      askerHandle: 'rachelgreen',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-11',
      question: "What's your view on the regulatory challenges facing DeFi and how should the ecosystem adapt?",
      askerName: 'Jennifer Adams',
      askerHandle: 'jennadams',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-12',
      question: "How do you prioritize security versus innovation when implementing new Ethereum features?",
      askerName: 'Dr. Robert Chang',
      askerHandle: 'robertchang',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-13',
      question: "What are the implications of quantum computing for Ethereum's cryptographic security?",
      askerName: 'Dr. Sophie Miller',
      askerHandle: 'sophiemiller',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-14',
      question: "How should we approach governance token design to ensure long-term protocol sustainability?",
      askerName: 'Thomas Anderson',
      askerHandle: 'thomasanderson',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-15',
      question: "What's the most effective way to educate traditional finance professionals about Ethereum's capabilities?",
      askerName: 'Maria Gonzalez',
      askerHandle: 'mariagonzalez',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-16',
      question: "What are your thoughts on the environmental impact of Ethereum post-merge and future sustainability?",
      askerName: 'Dr. Kevin Brown',
      askerHandle: 'kevinbrown',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-17',
      question: "How do you see the evolution of smart contract programming languages beyond Solidity?",
      askerName: 'Dr. Laura Davis',
      askerHandle: 'lauradavis',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-18',
      question: "What role should formal verification play in ensuring smart contract security at scale?",
      askerName: 'Prof. Alan Taylor',
      askerHandle: 'alantaylor',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-19',
      question: "What are the key technical challenges in implementing sharding and how close are we to solving them?",
      askerName: 'Dr. Peter Zhang',
      askerHandle: 'peterzhang',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    },
    {
      id: 'rt-20',
      question: "How should we balance innovation speed with security auditing in the rapidly evolving DeFi space?",
      askerName: 'Dr. Catherine White',
      askerHandle: 'catherinewhite',
      askerAvatar: '',
      askedTime: '',
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    }
  ];

  // Initialize real-time questions with first 5
  useEffect(() => {
    if (mode === 'realtime' && realtimeQuestions.length === 0) {
      const now = new Date();
      const initialQuestions = realtimeQuestionsPool.slice(0, 5).map((question, index) => ({
        ...question,
        addedAt: new Date(now.getTime() - (index + 1) * 10000) // 10s, 20s, 30s, 40s, 50s ago
      }));
      setRealtimeQuestions(initialQuestions);
      setQuestionQueue(realtimeQuestionsPool.slice(5));
      setNewestQuestionTime(now);
    }
  }, [mode]);

  // Real-time question rotation
  useEffect(() => {
    if (mode !== 'realtime' || questionQueue.length === 0) return;

    const getRandomInterval = () => Math.random() * 2000 + 3000; // 3-5 seconds

    const addNewQuestion = () => {
      if (questionQueue.length === 0) return;

      const nextQuestion = { ...questionQueue[0], addedAt: new Date() };
      const remainingQueue = questionQueue.slice(1);
      
      // Add the removed question back to the end of the queue (without addedAt)
      const lastQuestion = realtimeQuestions[realtimeQuestions.length - 1];
      const { addedAt, ...questionWithoutTimestamp } = lastQuestion;
      const updatedQueue = [...remainingQueue, questionWithoutTimestamp];

      setRealtimeQuestions(prev => [nextQuestion, ...prev.slice(0, 4)]);
      setQuestionQueue(updatedQueue);
      setNewestQuestionTime(new Date()); // Update time for new question
    };

    const timeoutId = setTimeout(addNewQuestion, getRandomInterval());
    return () => clearTimeout(timeoutId);
  }, [mode, questionQueue, realtimeQuestions]);

  // Individual timers for all real-time questions
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    if (mode !== 'realtime') return;

    const interval = setInterval(() => {
      forceUpdate({}); // Force re-render to update all timers
    }, 1000);
    
    return () => clearInterval(interval);
  }, [mode]);

  // Function to calculate time ago for individual questions
  const getTimeAgo = (addedAt: Date | undefined): string => {
    if (!addedAt) return '';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - addedAt.getTime()) / 1000);
    
    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else {
      return `${Math.floor(diff / 3600)}h ago`;
    }
  };

  const currentQuestions = mode === 'trending' ? trendingQuestions : realtimeQuestions;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="h-full"
    >
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200/60 rounded-xl shadow-sm backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200/40">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg blur-sm opacity-20" />
              <MessageCircle className="w-5 h-5 text-blue-600 relative z-10 drop-shadow-sm" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">Recently Asked</h3>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('trending')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  mode === 'trending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                <span>Trending</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('realtime')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  mode === 'realtime'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Zap className="w-3 h-3" strokeWidth={2} />
                <span>Live</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable Questions */}
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full overflow-y-auto pr-2 scrollbar-thin">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {currentQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    layout
                    initial={
                      mode === 'realtime' && index === 0
                        ? { opacity: 0, x: 300, scale: 0.8, rotateY: 90 }
                        : { opacity: 0, y: 20 }
                    }
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      x: 0, 
                      scale: 1, 
                      rotateY: 0 
                    }}
                    exit={
                      mode === 'realtime'
                        ? { opacity: 0, x: -300, scale: 0.8, rotateY: -90 }
                        : { opacity: 0, y: -20 }
                    }
                    transition={{ 
                      duration: mode === 'realtime' ? 0.8 : 0.3,
                      delay: mode === 'trending' ? index * 0.05 : 0,
                      type: "spring",
                      stiffness: mode === 'realtime' ? 100 : 200,
                      damping: mode === 'realtime' ? 20 : 25
                    }}
                  >
                    <QuestionCard 
                      {...question} 
                      askedTime={mode === 'realtime' ? getTimeAgo(question.addedAt) : question.askedTime}
                      isNew={mode === 'realtime' && index === 0}
                    />
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

export default RecentlyAsked;