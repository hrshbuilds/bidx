import { NextRequest, NextResponse } from 'next/server';
import { ScoringEngine } from '@/services/scoringEngine';
import { Bidder } from '@/types/bidder';
import { Tender } from '@/types/tender';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bidder, tender } = body as { bidder: Bidder; tender: Tender };

    if (!bidder || !tender) {
      return NextResponse.json(
        { error: 'Missing bidder or tender payload in verification request.' },
        { status: 400 }
      );
    }

    const report = await ScoringEngine.evaluateBidderCompliance(bidder, tender);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error during compliance verification.' },
      { status: 500 }
    );
  }
}
