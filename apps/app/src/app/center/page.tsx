import { Metadata } from 'next/types';
import { PageLayout } from 'layout';
import { GnosisPayIndexerCenter } from './components/GnosisPayIndexerCenter';

export const metadata: Metadata = {
  title: 'Indexer',
  description: 'Indexer',
};

export default function GnosisPayIndexerCenterPage() {
  return (
    <PageLayout>
      <GnosisPayIndexerCenter />
    </PageLayout>
  );
}
