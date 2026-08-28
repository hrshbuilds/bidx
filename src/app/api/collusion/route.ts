import { NextRequest, NextResponse } from 'next/server';
import { CollusionEngine } from '@/services/collusionEngine';
import { Bidder } from '@/types/bidder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenderId, bidders } = body as { tenderId: string; bidders: Bidder[] };

    if (!tenderId || !bidders) {
      return NextResponse.json(
        { error: 'Missing tenderId or bidders array.' },
        { status: 400 }
      );
    }

    const report = CollusionEngine.analyzeTenderIntegrity(tenderId, bidders);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error during collusion analysis.' },
      { status: 500 }
    );
  }
}
