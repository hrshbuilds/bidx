import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '@/services/auditService';

describe('AuditService - SHA-256 Cryptographic Hash-Chained Audit Ledger', () => {
  beforeEach(() => {
    AuditService.resetChain();
  });

  it('should initialize genesis block and log sequential events', () => {
    AuditService.initializeGenesis();
    const logs = AuditService.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].index).toBe(0);
    expect(logs[0].previousHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');

    const block1 = AuditService.logEvent(
      'TND-001',
      'CONSENT_RECORDED',
      'Bidder Gateway',
      { consentGiven: true, ip: '103.11.22.33' },
      'BID-001'
    );

    expect(block1.index).toBe(1);
    expect(block1.previousHash).toBe(logs[0].currentHash);
  });

  it('should verify chain integrity as valid when uncorrupted', () => {
    AuditService.logEvent('TND-001', 'GATE_EVALUATION', 'GateEngine', { gate: 'DEBARMENT', status: 'PASSED' });
    AuditService.logEvent('TND-001', 'SCORE_COMPUTED', 'ScoringEngine', { score: 94 });

    const verification = AuditService.verifyChainIntegrity();
    expect(verification.isValid).toBe(true);
    expect(verification.totalBlocks).toBe(3); // Genesis + 2 events
  });

  it('should detect tampering and pinpoint broken block index when a block payload is modified', () => {
    AuditService.logEvent('TND-001', 'GATE_EVALUATION', 'GateEngine', { status: 'PASSED' });
    AuditService.logEvent('TND-001', 'SCORE_COMPUTED', 'ScoringEngine', { score: 94 });

    // Tamper with block #1
    AuditService.simulateTamper(1, 'status', 'TAMPERED_FRAUD');

    const verification = AuditService.verifyChainIntegrity();
    expect(verification.isValid).toBe(false);
    expect(verification.brokenBlockIndex).toBe(1);
    expect(verification.verificationMessage).toContain('altered');
  });
});
