import { describe, it, expect } from 'vitest';
import { GateEngine } from '@/services/gateEngine';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';

describe('GateEngine - Qualifying Requirements Hard Gates', () => {
  const tender1 = SAMPLE_TENDERS[0].tender;
  const cleanBidder = SAMPLE_TENDERS[0].bidders[0]; // TechPro
  const debarredBidder = SAMPLE_TENDERS[0].bidders[2]; // AeroByte (Debarred)

  it('should pass all hard gates for a clean bidder with active registrations', async () => {
    const result = await GateEngine.evaluateHardGates(cleanBidder, tender1);
    expect(result.isEligible).toBe(true);
    expect(result.gateResults.every((g) => g.status === 'PASSED')).toBe(true);
  });

  it('should immediately fail with NOT_ELIGIBLE when a bidder is debarred in Central Registry', async () => {
    const result = await GateEngine.evaluateHardGates(debarredBidder, tender1);
    expect(result.isEligible).toBe(false);
    
    const debarmentGate = result.gateResults.find((g) => g.gateId === 'GATE_DEBARMENT');
    expect(debarmentGate).toBeDefined();
    expect(debarmentGate?.status).toBe('FAILED');
    expect(debarmentGate?.severity).toBe('FATAL');
    expect(debarmentGate?.reason).toContain('Debarred/Blacklisted');
  });

  it('should fail when MCA21 company status is STRUCK_OFF', async () => {
    const struckOffBidder = {
      ...cleanBidder,
      mcaFilings: {
        ...cleanBidder.mcaFilings,
        status: 'STRUCK_OFF' as const,
      },
    };

    const result = await GateEngine.evaluateHardGates(struckOffBidder, tender1);
    expect(result.isEligible).toBe(false);
    const mcaGate = result.gateResults.find((g) => g.gateId === 'GATE_MCA_LEGAL_STATUS');
    expect(mcaGate?.status).toBe('FAILED');
  });

  it('should fail when a fraudulent or bad checksum document is detected', async () => {
    const tamperedBidder = {
      ...cleanBidder,
      submittedDocuments: [
        {
          id: 'DOC-TAMPER',
          type: 'GST_CERTIFICATE' as const,
          title: 'Fake GST Document',
          documentNumber: '07AAACT4819M1Z8',
          source: 'BIDDER_UPLOAD' as const,
          isDigiLockerVerified: false,
          issuer: 'Unknown',
          issuedDate: '2021-01-01',
          checksum: 'bad_tampered_hash_123',
          extractedData: {},
        },
      ],
    };

    const result = await GateEngine.evaluateHardGates(tamperedBidder, tender1);
    expect(result.isEligible).toBe(false);
    const docGate = result.gateResults.find((g) => g.gateId === 'GATE_DOC_AUTHENTICITY');
    expect(docGate?.status).toBe('FAILED');
  });
});
