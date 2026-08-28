export interface DebarmentRecord {
  isDebarred: boolean;
  orderNumber?: string;
  authority?: string;
  debarmentStartDate?: string;
  debarmentEndDate?: string;
  reason?: string;
  gazetteReference?: string;
}

export class DebarmentRegistry {
  // Live simulated central debarment blacklist database
  private static blacklistedEntities: Record<string, DebarmentRecord> = {
    // Flagged PANs / CINs for testing
    'AABCE9999K': {
      isDebarred: true,
      orderNumber: 'CVC/ORD/2025/8812',
      authority: 'Central Vigilance Commission (CVC) & Department of Expenditure',
      debarmentStartDate: '2025-04-01',
      debarmentEndDate: '2028-03-31',
      reason: 'Rule 151 of GFR 2017 - Corrupt / Fraudulent practices in public procurement.',
      gazetteReference: 'Gazette of India Extraordinary Part II Sec 3(i) No. 994',
    },
    'U72200DL2020PTC369999': {
      isDebarred: true,
      orderNumber: 'GeM/DEB/2026/012',
      authority: 'GeM Incident Management & Debarment Committee',
      debarmentStartDate: '2026-01-15',
      debarmentEndDate: '2027-01-14',
      reason: 'Persistent default on contractual delivery timeline and forged OEM credentials.',
      gazetteReference: 'GeM Debarred Vendor Registry Portal ID: D-4091',
    },
    '27AABCE9999K1Z5': {
      isDebarred: true,
      orderNumber: 'CVC/ORD/2025/8812',
      authority: 'Central Vigilance Commission',
      debarmentStartDate: '2025-04-01',
      debarmentEndDate: '2028-03-31',
      reason: 'Blacklisted due to coordinated cartel submission in Railway e-Procurement.',
      gazetteReference: 'CVC-DoE Notification 2025/8812',
    },
  };

  /**
   * Always runs LIVE (Tier 2 - Never Cached).
   * Checks whether PAN, GSTIN, or CIN is present in the Central Blacklisting Registry.
   */
  static async checkLiveDebarment(pan: string, gstin?: string, cin?: string): Promise<DebarmentRecord> {
    // Normalize keys
    const cleanPan = (pan || '').trim().toUpperCase();
    const cleanGstin = (gstin || '').trim().toUpperCase();
    const cleanCin = (cin || '').trim().toUpperCase();

    if (this.blacklistedEntities[cleanPan]) {
      return this.blacklistedEntities[cleanPan];
    }
    if (cleanGstin && this.blacklistedEntities[cleanGstin]) {
      return this.blacklistedEntities[cleanGstin];
    }
    if (cleanCin && this.blacklistedEntities[cleanCin]) {
      return this.blacklistedEntities[cleanCin];
    }

    return {
      isDebarred: false,
    };
  }
}
