export interface McaCompanyDetails {
  cin: string;
  companyName: string;
  companyStatus: 'ACTIVE' | 'STRUCK_OFF' | 'UNDER_LIQUIDATION' | 'DORMANT';
  classOfCompany: 'PRIVATE' | 'PUBLIC';
  authorizedCapital: number;
  paidUpCapital: number;
  dateOfIncorporation: string;
  registeredAddress: string;
  emailId: string;
  annualReturnLastFiledYear: string;
  financialStatementsLastFiledYear: string;
  statutoryAuditorName: string;
  statutoryAuditorDinOrMembership: string;
  directors: {
    din: string;
    name: string;
    designation: string;
    appointmentDate: string;
    status: 'ACTIVE' | 'DISQUALIFIED';
  }[];
}

export class Mca21Service {
  /**
   * Fetches MCA21 registry details by Corporate Identification Number (CIN)
   */
  static async fetchCompanyByCin(cin: string): Promise<McaCompanyDetails> {
    const isValidCin = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin);
    
    // Check if mock debarred/struck-off flag is present in CIN string
    if (cin.includes('STRUCK') || cin.includes('999999')) {
      return {
        cin,
        companyName: 'STRUCK OFF DEFALCATION ENTITY',
        companyStatus: 'STRUCK_OFF',
        classOfCompany: 'PRIVATE',
        authorizedCapital: 1000000,
        paidUpCapital: 100000,
        dateOfIncorporation: '2021-03-10',
        registeredAddress: 'Plot 4, Industrial Area, Noida, UP - 201301',
        emailId: 'admin@defalcation.in',
        annualReturnLastFiledYear: '2023',
        financialStatementsLastFiledYear: '2023',
        statutoryAuditorName: 'M/s Defunct Auditors LLP',
        statutoryAuditorDinOrMembership: 'FRN-882194',
        directors: [
          {
            din: '09999999',
            name: 'Disqualified Director',
            designation: 'Director',
            appointmentDate: '2021-03-10',
            status: 'DISQUALIFIED',
          },
        ],
      };
    }

    if (!isValidCin) {
      return {
        cin,
        companyName: 'INVALID CIN RECORD',
        companyStatus: 'STRUCK_OFF',
        classOfCompany: 'PRIVATE',
        authorizedCapital: 0,
        paidUpCapital: 0,
        dateOfIncorporation: '1970-01-01',
        registeredAddress: 'N/A',
        emailId: 'na@na.com',
        annualReturnLastFiledYear: 'N/A',
        financialStatementsLastFiledYear: 'N/A',
        statutoryAuditorName: 'N/A',
        statutoryAuditorDinOrMembership: 'N/A',
        directors: [],
      };
    }

    return {
      cin,
      companyName: 'ACTIVE REGISTERED ENTERPRISE',
      companyStatus: 'ACTIVE',
      classOfCompany: 'PRIVATE',
      authorizedCapital: 50000000,
      paidUpCapital: 20000000,
      dateOfIncorporation: '2019-05-14',
      registeredAddress: 'Tower B, DLF Cyber City, Sector 25, Gurugram, Haryana - 122002',
      emailId: 'compliance@enterprise.co.in',
      annualReturnLastFiledYear: '2025-26',
      financialStatementsLastFiledYear: '2025-26',
      statutoryAuditorName: 'M/s S.K. Agrawal & Co Chartered Accountants',
      statutoryAuditorDinOrMembership: 'FRN-001923N',
      directors: [
        {
          din: '08129481',
          name: 'Rajesh Kumar Sharma',
          designation: 'Managing Director',
          appointmentDate: '2019-05-14',
          status: 'ACTIVE',
        },
      ],
    };
  }
}
