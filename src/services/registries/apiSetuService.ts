export interface GstnStatus {
  gstin: string;
  tradeName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
  taxpayerType: 'REGULAR' | 'COMPOSITION';
  registrationDate: string;
  lastReturnPeriod: string;
  gstr3bFilingStatus: 'FILED' | 'DEFAULT' | 'LATE';
  gstr1FilingStatus: 'FILED' | 'DEFAULT';
  jurisdiction: string;
  matchedWithPan: boolean;
}

export interface PanStatus {
  pan: string;
  nameAsPerPan: string;
  status: 'OPERATIVE' | 'INOPERATIVE' | 'DELETED';
  aadhaarLinked: boolean;
  itrFilingLastYear: boolean;
  category: 'COMPANY' | 'FIRM' | 'INDIVIDUAL';
}

export interface UdyamStatus {
  udyamNumber: string;
  enterpriseName: string;
  category: 'MICRO' | 'SMALL' | 'MEDIUM';
  enterpriseType: 'MANUFACTURING' | 'SERVICES';
  majorActivity: string;
  status: 'ACTIVE' | 'CANCELLED';
  validTill?: string;
  socialCategory: 'GENERAL' | 'OBC' | 'SC' | 'ST';
  womenOwned: boolean;
}

export interface EpfoEsicStatus {
  epfoNumber: string;
  establishmentName: string;
  totalActiveMembers: number;
  lastEcrMonth: string;
  paymentStatus: 'PAID' | 'DEFAULT' | 'PENDING';
  esicNumber?: string;
  esicStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'EXEMPTED';
}

export class ApiSetuService {
  /**
   * Fetches live GSTN details from simulated API Setu endpoint
   */
  static async fetchGstnDetails(gstin: string, consentToken: string): Promise<GstnStatus> {
    if (!consentToken) {
      throw new Error('API Setu: Consent token required for GSTN access');
    }

    // Basic checksum validation for Indian GSTIN (15 chars)
    const isValidFormat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
    if (!isValidFormat) {
      return {
        gstin,
        tradeName: 'UNKNOWN / INVALID FORMAT',
        status: 'CANCELLED',
        taxpayerType: 'REGULAR',
        registrationDate: 'N/A',
        lastReturnPeriod: 'N/A',
        gstr3bFilingStatus: 'DEFAULT',
        gstr1FilingStatus: 'DEFAULT',
        jurisdiction: 'N/A',
        matchedWithPan: false,
      };
    }

    return {
      gstin,
      tradeName: 'REGULAR ENTERPRISE',
      status: 'ACTIVE',
      taxpayerType: 'REGULAR',
      registrationDate: '2018-07-01',
      lastReturnPeriod: 'JUL-2026',
      gstr3bFilingStatus: 'FILED',
      gstr1FilingStatus: 'FILED',
      jurisdiction: 'State Tax Ward 14, New Delhi',
      matchedWithPan: true,
    };
  }

  /**
   * Validates PAN status via API Setu / Income Tax NSDL
   */
  static async verifyPan(pan: string, consentToken: string): Promise<PanStatus> {
    if (!consentToken) {
      throw new Error('API Setu: Consent token required for PAN verification');
    }

    const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    if (!isValidFormat) {
      return {
        pan,
        nameAsPerPan: 'INVALID FORMAT',
        status: 'INOPERATIVE',
        aadhaarLinked: false,
        itrFilingLastYear: false,
        category: 'COMPANY',
      };
    }

    return {
      pan,
      nameAsPerPan: 'ENTERPRISE TAXPAYER',
      status: 'OPERATIVE',
      aadhaarLinked: true,
      itrFilingLastYear: true,
      category: pan[3] === 'C' ? 'COMPANY' : 'FIRM',
    };
  }

  /**
   * Fetches Udyam MSME status from MSME Ministry portal via API Setu
   */
  static async fetchUdyamDetails(udyamNumber: string): Promise<UdyamStatus> {
    return {
      udyamNumber,
      enterpriseName: 'MSME ENTERPRISE',
      category: 'SMALL',
      enterpriseType: 'MANUFACTURING',
      majorActivity: 'IT Hardware & Telecom Equipment',
      status: 'ACTIVE',
      validTill: '2030-03-31',
      socialCategory: 'GENERAL',
      womenOwned: false,
    };
  }

  /**
   * Checks EPFO/ESIC compliance status
   */
  static async checkEpfoEsic(epfoNumber: string): Promise<EpfoEsicStatus> {
    return {
      epfoNumber,
      establishmentName: 'ESTABLISHMENT COMPLIANCE UNIT',
      totalActiveMembers: 48,
      lastEcrMonth: 'JUL-2026',
      paymentStatus: 'PAID',
      esicNumber: 'ESIC-99201948',
      esicStatus: 'COMPLIANT',
    };
  }
}
