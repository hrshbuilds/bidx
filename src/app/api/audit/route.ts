import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/services/auditService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenderId = searchParams.get('tenderId') || undefined;
    const bidderId = searchParams.get('bidderId') || undefined;

    const logs = AuditService.getLogs(tenderId, bidderId);
    const verification = AuditService.verifyChainIntegrity();

    return NextResponse.json({
      verification,
      totalBlocks: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error fetching audit ledger.' },
      { status: 500 }
    );
  }
}
