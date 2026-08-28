'use client';

import React from 'react';
import { TenderForm } from '@/components/features/tender-wizard/tender-form';
import { Tender } from '@/types/tender';
import { Bidder } from '@/types/bidder';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';

export default function TenderWizardPage() {
  const handleTenderCreated = (newTender: Tender, newBidders: Bidder[]) => {
    SAMPLE_TENDERS.unshift({
      tender: newTender,
      bidders: newBidders,
    });
  };

  return (
    <div className="space-y-6">
      <TenderForm onTenderCreated={handleTenderCreated} />
    </div>
  );
}
