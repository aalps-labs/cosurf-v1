// src/app/api/premium/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This endpoint is protected by x402 middleware
  // Payment verification happens automatically before this function executes
  
  return NextResponse.json({
    success: true,
    message: "Welcome to premium content!",
    data: {
      timestamp: new Date().toISOString(),
      premiumFeature: "Advanced market analytics",
      exclusiveData: {
        marketTrends: ["AI adoption rising", "Crypto integration expanding"],
        predictions: ["Q4 growth expected", "New partnerships incoming"]
      },
      accessLevel: "premium",
      cost: "$0.01 USDC"
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: "Premium data processed",
    processedData: body,
    timestamp: new Date().toISOString()
  });
}
