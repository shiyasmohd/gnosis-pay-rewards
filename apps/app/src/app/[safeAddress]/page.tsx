import { PageLayout } from 'layout';
import { GnosisPaySafeProfileContainer } from './GnosisPaySafeProfileContainer';

type PageProps = {
  params: {
    safeAddress: string;
  };
};

export default function GnosisPaySafeAddressProfilePage(props: PageProps) {
  return (
    <PageLayout>
      <GnosisPaySafeProfileContainer safeAddress={props.params.safeAddress} />
    </PageLayout>
  );
}
