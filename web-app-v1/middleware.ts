// middleware.ts
import { paymentMiddleware } from "x402-next";
import { facilitator } from "@coinbase/x402";

export const middleware = paymentMiddleware(
  process.env.PAYMENT_ADDRESS! as `0x${string}`, // Your payment address
  {
    // Define protected routes and their pricing
    "/api/premium": {
      price: "$0.01",
      network: process.env.NETWORK as any,
      config: {
        description: "Premium API access with exclusive data",
        mimeType: "application/json",
        // Optional: Define input/output schemas for API documentation
        outputSchema: {
          type: "object",
          properties: {
            data: { type: "object" },
            timestamp: { type: "string" },
            premiumFeature: { type: "string" }
          }
        }
      }
    },
    "/api/analytics": {
      price: "$0.05",
      network: process.env.NETWORK as any,
      config: {
        description: "Advanced analytics and market data",
        mimeType: "application/json"
      }
    },
    "/api/ai-insights": {
      price: "$0.10",
      network: process.env.NETWORK as any,
      config: {
        description: "AI-powered market insights and predictions",
        mimeType: "application/json"
      }
    }
  },
  facilitator // Use Coinbase's facilitator service
);

export const config = {
  matcher: [
    "/api/premium/:path*",
    "/api/analytics/:path*", 
    "/api/ai-insights/:path*"
  ],
  runtime: 'nodejs', // Required until Edge runtime support is added
};
