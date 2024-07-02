import { LandingPage } from 'components/pages/landing';
import { getPageTitle } from 'utils/getPageTitle';

export const metadata = {
  title: getPageTitle(),
};
export default function IndexPage() {
  return <LandingPage />;
}
