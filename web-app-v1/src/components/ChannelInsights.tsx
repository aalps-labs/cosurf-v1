'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Maximize2, X } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  content: string;
}

interface ChannelInsightsProps {
  channelId: string;
  className?: string;
}

const ethCryptoInsights: Insight[] = [
  {
    id: 'eth-market-analysis',
    title: 'ETH Market Analysis & Price Dynamics',
    content: `# ETH Market Analysis & Price Dynamics

## Current Market Position

Ethereum continues to dominate the smart contract platform space, maintaining its position as the second-largest cryptocurrency by market capitalization at **$2,847** per ETH (as of latest data).

### Key Market Metrics
- **Market Cap**: $342.5 billion
- **24h Volume**: $15.2 billion
- **Circulating Supply**: 120.3 million ETH
- **Market Dominance**: 18.7% of total crypto market

## Technical Analysis

### Price Action & Trends
- **Current Trend**: Bullish consolidation above $2,800 support
- **Resistance Levels**: $3,200, $3,500, $4,000
- **Support Levels**: $2,650, $2,400, $2,200
- **RSI**: 58.4 (neutral territory)

### On-Chain Metrics
- **Network Hash Rate**: 892.5 TH/s (+12% from last month)
- **Active Addresses**: 542,000 daily active addresses
- **Transaction Fees**: Average $8.50 per transaction
- **Gas Price**: 25 Gwei (moderate congestion)

## Institutional Adoption

### Recent Developments
1. **ETF Approvals**: Spot Ethereum ETFs seeing $2.1B in net inflows
2. **Corporate Treasury**: 15+ Fortune 500 companies hold ETH
3. **DeFi Integration**: $58B total value locked across Ethereum DeFi

### Staking Metrics
- **Total Staked**: 34.2 million ETH (28.4% of supply)
- **Staking Yield**: 3.8% annual percentage rate
- **Validator Count**: 1.07 million active validators

## Market Catalysts

### Positive Drivers
- **Layer 2 Scaling**: Arbitrum, Optimism, Polygon reducing fees by 90%+
- **EIP-4844 (Dencun)**: Proto-danksharding reducing L2 costs further
- **Institutional Adoption**: Growing corporate and institutional interest
- **DeFi Innovation**: Continued growth in decentralized applications

### Risk Factors
- **Regulatory Uncertainty**: SEC classification concerns
- **Competition**: Solana, Cardano, and other L1s gaining market share
- **Scalability**: Base layer still faces congestion during high demand
- **Energy Concerns**: Despite PoS, environmental scrutiny continues`
  },
  {
    id: 'defi-ecosystem-report',
    title: 'DeFi Ecosystem & Protocol Analysis',
    content: `# DeFi Ecosystem & Protocol Analysis

## Total Value Locked (TVL) Overview

The Ethereum DeFi ecosystem continues to lead with **$58.2 billion** in total value locked across 200+ protocols.

### Top DeFi Protocols by TVL
| Protocol | TVL | Category | 7d Change |
|----------|-----|----------|-----------|
| **Lido** | $32.8B | Liquid Staking | +2.3% |
| **Aave** | $11.2B | Lending | +1.8% |
| **Uniswap V3** | $4.1B | DEX | +0.9% |
| **Compound** | $2.8B | Lending | -0.5% |
| **Curve** | $2.4B | DEX | +1.2% |

## Sector Analysis

### Liquid Staking Dominance
- **Market Share**: 56% of total DeFi TVL
- **Growth Rate**: +145% year-over-year
- **Key Players**: Lido (stETH), Rocket Pool (rETH), Coinbase (cbETH)
- **Yield Opportunities**: 3.2% - 4.1% APY on staked ETH

### Lending & Borrowing
- **Total Borrowed**: $8.9 billion across all protocols
- **Average Borrow Rate**: 4.2% APY
- **Collateralization Ratio**: 165% average across platforms
- **Bad Debt**: <0.1% of total loans (excellent health)

### Decentralized Exchanges
- **Daily Volume**: $1.8 billion average
- **Uniswap Dominance**: 65% of DEX volume
- **Fee Revenue**: $2.1M daily across all DEXs
- **LP Token Yields**: 5-15% APY depending on pair volatility

## Innovation Trends

### Real World Assets (RWA)
- **Market Size**: $2.1 billion tokenized assets
- **Growth**: +340% in 2024
- **Key Protocols**: MakerDAO, Centrifuge, Goldfinch
- **Asset Types**: Treasury bills, real estate, commodities

### Cross-Chain Integration
- **Bridge Volume**: $890M weekly cross-chain transfers
- **Popular Routes**: Ethereum ↔ Arbitrum, Ethereum ↔ Polygon
- **Security Improvements**: Multi-sig bridges, optimistic verification
- **Interoperability**: LayerZero, Wormhole gaining adoption

### Yield Strategies
1. **ETH Staking**: 3.8% base yield + MEV rewards
2. **Liquidity Provision**: 8-20% APY on major pairs
3. **Lending**: 2-6% APY on stablecoins
4. **Yield Farming**: 15-50% APY (higher risk)

## Risk Assessment

### Protocol Risks
- **Smart Contract Risk**: Audit coverage at 85% for top protocols
- **Governance Risk**: Token concentration in top protocols
- **Liquidity Risk**: Potential bank runs during market stress

### Market Risks
- **Impermanent Loss**: 2-8% average for LP providers
- **Liquidation Risk**: $1.2B in positions at risk if ETH drops 20%
- **Regulatory Risk**: Potential DeFi regulation impact`
  },
  {
    id: 'layer2-scaling-analysis',
    title: 'Layer 2 Scaling Solutions Deep Dive',
    content: `# Layer 2 Scaling Solutions Deep Dive

## Layer 2 Ecosystem Overview

Ethereum's Layer 2 solutions have achieved remarkable growth, processing **4.2 million transactions daily** while reducing costs by up to 95%.

### Leading L2 Networks

#### Arbitrum One
- **TVL**: $13.2 billion
- **Daily Transactions**: 1.8M
- **Average Fee**: $0.15
- **Technology**: Optimistic Rollup
- **Ecosystem**: 400+ dApps deployed

#### Optimism
- **TVL**: $7.8 billion  
- **Daily Transactions**: 890K
- **Average Fee**: $0.12
- **Technology**: Optimistic Rollup
- **Ecosystem**: 250+ dApps, strong governance focus

#### Polygon zkEVM
- **TVL**: $1.4 billion
- **Daily Transactions**: 450K
- **Average Fee**: $0.08
- **Technology**: Zero-Knowledge Rollup
- **Ecosystem**: 180+ dApps, EVM equivalent

#### Base (Coinbase)
- **TVL**: $2.1 billion
- **Daily Transactions**: 1.2M
- **Average Fee**: $0.05
- **Technology**: Optimistic Rollup (OP Stack)
- **Ecosystem**: 320+ dApps, strong consumer focus

## Technical Comparison

### Transaction Throughput
| Network | TPS | Finality | Withdrawal Time |
|---------|-----|----------|-----------------|
| **Arbitrum** | 4,500 | Instant | 7 days |
| **Optimism** | 4,000 | Instant | 7 days |
| **Polygon zkEVM** | 2,000 | ~10 min | 30 min |
| **Base** | 5,000 | Instant | 7 days |

### Cost Analysis
- **Ethereum L1**: $8.50 average transaction fee
- **Arbitrum**: $0.15 (98% reduction)
- **Optimism**: $0.12 (99% reduction)  
- **Polygon zkEVM**: $0.08 (99% reduction)
- **Base**: $0.05 (99.4% reduction)

## Adoption Metrics

### Developer Activity
- **GitHub Commits**: 15,000+ monthly across L2 ecosystems
- **New Deployments**: 450+ smart contracts daily
- **Developer Tools**: Comprehensive tooling for all major L2s
- **Documentation**: High-quality docs and tutorials available

### User Growth
- **Monthly Active Users**: 8.2M across all L2s
- **New Wallet Creation**: 180K weekly
- **Cross-Chain Activity**: 65% of users active on multiple L2s
- **Retention Rate**: 78% monthly active user retention

## DeFi on Layer 2

### Protocol Migration
- **Uniswap**: $2.1B TVL across Arbitrum, Optimism, Polygon
- **Aave**: $1.8B TVL on Arbitrum and Optimism
- **Curve**: $890M TVL across multiple L2s
- **1inch**: Integrated on all major L2 networks

### Yield Opportunities
1. **Arbitrum DeFi**: 6-18% APY on major protocols
2. **Optimism Rewards**: Additional OP token incentives
3. **Base Ecosystem**: New protocols offering high yields
4. **Cross-L2 Arbitrage**: MEV opportunities between chains

## Future Developments

### EIP-4844 Impact (Dencun Upgrade)
- **Proto-Danksharding**: Reduces L2 data costs by 90%
- **Blob Transactions**: New transaction type for L2 data
- **Cost Reduction**: L2 fees expected to drop to $0.01-0.05
- **Throughput Increase**: 10x improvement in L2 capacity

### Upcoming Technologies
- **ZK-STARKs**: More efficient zero-knowledge proofs
- **Shared Sequencing**: Cross-L2 atomic transactions
- **Data Availability**: Celestia and EigenDA integration
- **Account Abstraction**: Native smart wallet support

## Investment Thesis
Layer 2 solutions represent the primary scaling path for Ethereum, with total L2 TVL expected to reach **$100 billion by 2025** as fees continue to decrease and user experience improves.`
  },
  {
    id: 'nft-gaming-metaverse',
    title: 'NFTs, Gaming & Metaverse Trends',
    content: `# NFTs, Gaming & Metaverse Trends

## NFT Market Overview

The NFT market has evolved significantly, with **$2.8 billion** in trading volume over the past 30 days across all chains.

### Market Statistics
- **Total Collections**: 47,000+ on Ethereum
- **Daily Volume**: $95M average
- **Active Traders**: 180,000 daily
- **Floor Price Index**: Down 65% from 2022 peaks but stabilizing

### Top Collections by Volume (30d)
| Collection | Volume (ETH) | Floor Price | Holders |
|------------|--------------|-------------|---------|
| **Pudgy Penguins** | 8,450 ETH | 12.5 ETH | 4,200 |
| **Bored Apes** | 6,890 ETH | 28.9 ETH | 5,800 |
| **Azuki** | 4,200 ETH | 8.2 ETH | 4,900 |
| **CryptoPunks** | 3,100 ETH | 65.0 ETH | 3,400 |
| **Milady** | 2,800 ETH | 3.8 ETH | 6,200 |

## Gaming & GameFi Evolution

### Blockchain Gaming Growth
- **Monthly Active Users**: 2.1M across all blockchain games
- **Game Tokens Market Cap**: $8.9 billion
- **New Games Launched**: 45 in Q4 2024
- **Investment**: $1.2B in gaming funding this year

### Leading Gaming Ecosystems

#### Immutable X
- **Games**: 200+ titles in development
- **Technology**: StarkEx L2 for zero gas fees
- **Partnerships**: GameStop, TikTok, Disney
- **Token (IMX)**: $1.85 (+15% monthly)

#### Polygon Gaming
- **Games**: 1,000+ games deployed
- **Partnerships**: Ubisoft, Atari, Decentraland
- **Infrastructure**: Polygon Supernets for gaming
- **Daily Transactions**: 3.2M gaming-related

#### Arbitrum Gaming
- **Games**: 150+ native games
- **Technology**: Low fees, fast finality
- **Ecosystem**: TreasureDAO, Battlefly, Realm
- **Growth**: +340% in gaming TVL

## Metaverse Development

### Virtual Real Estate
- **Total Sales**: $180M in virtual land (2024)
- **Average Price**: $2,400 per parcel
- **Active Worlds**: The Sandbox, Decentraland, Otherdeeds
- **Commercial Activity**: 450+ brands with virtual presence

### Metaverse Platforms Comparison
| Platform | Monthly Users | Land Floor | Token Price |
|----------|---------------|------------|-------------|
| **The Sandbox** | 350K | 0.8 ETH | $0.42 |
| **Decentraland** | 180K | 1.2 ETH | $0.38 |
| **Otherdeeds** | 120K | 0.6 ETH | N/A |
| **Somnium Space** | 45K | 2.1 ETH | $1.20 |

## Emerging Trends

### AI-Generated NFTs
- **Market Size**: $340M in AI art sales
- **Popular Tools**: Midjourney, DALL-E, Stable Diffusion
- **Platforms**: Art Blocks, AsyncArt, SuperRare
- **Legal Issues**: Copyright and ownership debates

### Utility-Focused NFTs
1. **Membership Tokens**: Access to exclusive communities
2. **Gaming Assets**: In-game items with cross-game utility
3. **Event Tickets**: NFT-based ticketing systems
4. **Identity & Credentials**: Decentralized identity solutions

### Cross-Chain NFTs
- **Omnichain NFTs**: LayerZero enabling cross-chain transfers
- **Multi-Chain Collections**: Projects launching on multiple chains
- **Bridge Volume**: $45M monthly in NFT bridge activity
- **Interoperability**: Wormhole, Axelar supporting NFT transfers

## Investment Opportunities

### Blue-Chip Collections
- **Established Value**: CryptoPunks, Bored Apes maintain premium
- **Liquidity**: High-volume trading and lending markets
- **Utility**: Continued development of holder benefits
- **Risk**: Lower volatility but limited upside

### Gaming Tokens
- **Growth Potential**: Early-stage gaming ecosystems
- **Utility**: In-game currencies and governance
- **Partnerships**: Traditional gaming company adoption
- **Risk**: High competition and execution risk

### Infrastructure Plays
- **NFT Marketplaces**: OpenSea, Blur, LooksRare
- **Gaming Infrastructure**: Immutable, Polygon, Arbitrum
- **Metaverse Platforms**: SAND, MANA, APE
- **Tools & Services**: NFT lending, fractionalization, analytics

## Future Outlook
The NFT and gaming sectors are transitioning from speculation to utility, with focus shifting to sustainable gameplay, real-world integration, and cross-platform interoperability.`
  },
  {
    id: 'regulatory-institutional-adoption',
    title: 'Regulatory Landscape & Institutional Adoption',
    content: `# Regulatory Landscape & Institutional Adoption

## Global Regulatory Overview

The cryptocurrency regulatory environment continues to evolve rapidly, with **67 countries** now having established or proposed crypto regulations.

### United States
- **SEC Approach**: Enforcement-heavy strategy with selective approvals
- **ETF Status**: 11 spot Bitcoin ETFs approved, Ethereum ETFs launched
- **Congressional Action**: Bipartisan crypto bills in development
- **CFTC Jurisdiction**: Commodities classification for BTC and ETH

### European Union
- **MiCA Regulation**: Markets in Crypto-Assets regulation fully implemented
- **Stablecoin Rules**: Reserve requirements and licensing mandatory
- **DeFi Guidance**: Consultation on decentralized finance regulation
- **Tax Framework**: Harmonized crypto taxation across EU members

### Asia-Pacific
- **Japan**: Clear regulatory framework, crypto exchange licensing
- **Singapore**: Comprehensive DeFi and stablecoin regulations
- **Hong Kong**: Retail crypto trading allowed with restrictions
- **Australia**: Crypto as financial product, licensing requirements

## Institutional Adoption Metrics

### Corporate Treasury Holdings
| Company | BTC Holdings | ETH Holdings | Total Value |
|---------|--------------|--------------|-------------|
| **MicroStrategy** | 174,530 BTC | 0 ETH | $16.8B |
| **Tesla** | 9,720 BTC | 0 ETH | $934M |
| **Block** | 8,027 BTC | 0 ETH | $772M |
| **Coinbase** | 9,000 BTC | 25,000 ETH | $1.2B |
| **Galaxy Digital** | 16,400 BTC | 15,100 ETH | $2.1B |

### ETF Performance
- **Bitcoin ETFs**: $28.4B in total assets under management
- **Ethereum ETFs**: $8.9B in total assets under management
- **Daily Volume**: $2.1B average across all crypto ETFs
- **Institutional Allocation**: 15% of ETF holdings from pension funds

### Banking Integration
- **Crypto Custody**: 45+ banks offering crypto custody services
- **Trading Services**: 23 major banks provide crypto trading
- **Payment Rails**: SWIFT exploring blockchain integration
- **Central Bank Digital Currencies**: 114 countries researching CBDCs

## Compliance Infrastructure

### KYC/AML Solutions
- **Chainalysis**: $4.2B valuation, government contracts
- **Elliptic**: Compliance tools for 600+ institutions
- **TRM Labs**: Real-time transaction monitoring
- **Compliance Costs**: $2.1M average annual spend for exchanges

### Regulatory Technology
1. **Transaction Monitoring**: Real-time AML screening
2. **Reporting Tools**: Automated regulatory reporting
3. **Risk Assessment**: ML-based risk scoring
4. **Audit Trails**: Immutable compliance records

### Tax Compliance
- **Software Solutions**: CoinTracker, Koinly, TaxBit
- **Institutional Tools**: Enterprise-grade tax reporting
- **DeFi Taxation**: Complex yield farming calculations
- **Cross-Border**: International tax treaty implications

## Institutional Investment Trends

### Hedge Fund Adoption
- **Crypto-Focused Funds**: $67B in assets under management
- **Traditional Funds**: 38% now have crypto exposure
- **Strategies**: Long-only, market neutral, DeFi yield
- **Performance**: 15.2% average return in 2024

### Pension Fund Allocation
- **Current Allocation**: 1.3% average crypto allocation
- **Target Allocation**: 5-10% recommended by consultants
- **Risk Management**: Gradual allocation increases
- **Governance**: Board-level crypto education programs

### Insurance & Risk Management
- **Crypto Insurance**: $15B in coverage available
- **Custody Insurance**: Standard for institutional custody
- **DeFi Insurance**: Nexus Mutual, InsurAce protocols
- **Risk Models**: Sophisticated crypto risk frameworks

## Future Regulatory Developments

### Expected Changes (2025)
1. **Stablecoin Legislation**: Comprehensive US framework
2. **DeFi Regulation**: Guidance on protocol governance
3. **Cross-Border Standards**: International coordination
4. **Market Structure**: Crypto market maker regulations

### Compliance Preparation
- **Regulatory Monitoring**: Continuous law tracking
- **Policy Development**: Internal compliance frameworks
- **Staff Training**: Regulatory education programs
- **Technology Investment**: RegTech solution adoption

### Investment Implications
- **Compliance Costs**: Rising operational expenses
- **Market Access**: Regulated entities gain advantages
- **Innovation Impact**: Potential constraints on development
- **Institutional Confidence**: Clear rules drive adoption

## Strategic Recommendations

### For Institutions
1. **Gradual Allocation**: Start with 1-3% portfolio allocation
2. **Compliance First**: Invest in robust compliance infrastructure
3. **Education**: Comprehensive staff and board education
4. **Risk Management**: Sophisticated crypto risk models

### For Protocols
1. **Regulatory Engagement**: Proactive regulator communication
2. **Compliance Design**: Build compliance into protocol design
3. **Geographic Strategy**: Multi-jurisdiction compliance approach
4. **Legal Clarity**: Seek regulatory guidance early

The regulatory landscape is moving toward greater clarity and institutional acceptance, creating a more mature and stable crypto ecosystem.`
  }
];

// Markdown components configuration (same as ChannelDescription)
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-bold text-gray-900 mb-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-semibold text-gray-800 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-medium text-gray-800 mb-2">{children}</h3>,
  p: ({ children }: any) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside text-gray-700 space-y-1 mb-3">{children}</ol>,
  li: ({ children }: any) => <li className="text-gray-700">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-gray-800">{children}</em>,
  del: ({ children }: any) => <del className="line-through text-gray-500">{children}</del>,
  code: ({ children }: any) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
  pre: ({ children }: any) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-800 mb-3">{children}</pre>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-3">{children}</blockquote>,
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="bg-white">{children}</tbody>,
  tr: ({ children }: any) => <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-indigo-600 hover:text-indigo-800 underline font-medium"
    >
      {children}
    </a>
  ),
};

export default function ChannelInsights({ channelId, className = "" }: ChannelInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight>(ethCryptoInsights[0]);
  const [showWiderView, setShowWiderView] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Channel Insights</h2>
          <p className="text-gray-600 text-sm">Comprehensive analysis and strategic reports</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowWiderView(true)}
          className="bg-white border border-gray-200 rounded-lg p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="flex h-96 space-x-6">
        {/* Left Side - Insight Titles */}
        <div className="w-1/3 border-r border-gray-200 pr-6">
          <div className="space-y-2">
            {ethCryptoInsights.map((insight, index) => (
              <motion.button
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedInsight(insight)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedInsight.id === insight.id
                    ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-900'
                    : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                }`}
              >
                <div className="font-medium text-sm leading-tight">
                  {insight.title}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Side - Insight Content */}
        <div className="flex-1">
          <motion.div
            key={selectedInsight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto pr-4 scrollbar-thin"
          >
            <div className="prose prose-sm prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {selectedInsight.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wider View Popup Dialog */}
      <AnimatePresence>
        {showWiderView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWiderView(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" />
                  <h2 className="text-lg font-semibold text-gray-900">Channel Insights</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWiderView(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Dialog Content */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left Sidebar - Insight Titles */}
                <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
                  <div className="space-y-2">
                    {ethCryptoInsights.map((insight, index) => (
                      <motion.button
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        onClick={() => setSelectedInsight(insight)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          selectedInsight.id === insight.id
                            ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-900'
                            : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-sm leading-tight">
                          {insight.title}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-5 overflow-y-auto scrollbar-thin">
                  <motion.div
                    key={selectedInsight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-none"
                  >
                    <div className="prose prose-gray max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {selectedInsight.content}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
