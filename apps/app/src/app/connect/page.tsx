import { PageLayout } from 'layout';
import { ConnectPageContent } from 'components/pages/connect/ConnectPageContent';
import { getPageTitle } from 'utils/getPageTitle';

export const metadata = {
  title: getPageTitle('Connect'),
};

export default function ConnectPage() {
  return (
    <PageLayout contentLayout="flex-center">
      <ConnectPageContent next={undefined} />
    </PageLayout>
  );
}
