# Surf Search V1

Next.js app with X402 payment protocol and Coinbase CDP SDK integration.

## Quick Setup

1. **Initialize submodules**
   ```bash
   git submodule update --init --recursive
   ```

2. **Environment setup**
   ```bash
   cd web-app-v1
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_BUYER_PRIVATE_KEY=0x_your_private_key_here
   NEXT_PUBLIC_NETWORK=base-sepolia
   NEXT_PUBLIC_CDP_API_KEY_ID=your_cdp_api_key_id
   NEXT_PUBLIC_CDP_API_KEY_SECRET=your_cdp_api_key_secret
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

## Key Files

- `src/lib/wallet.ts` - Viem wallet configuration
- `src/lib/x402-client.ts` - X402 payment client
- `src/app/api/` - API routes (ai-insights, analytics, premium)

## Troubleshooting

**"Cannot find module 'x402-axios'"**
```bash
git submodule update --init --recursive
cd submodules/x402/typescript && pnpm install && pnpm build --filter x402-axios
```

**Environment variables not working**
- Ensure `.env.local` is in `web-app-v1/` directory
- Check variable names match exactly (case-sensitive)
- Restart dev server after changes

## Tech Stack

Next.js 15 • React 19 • TypeScript • Tailwind CSS • Viem • X402 Protocol
