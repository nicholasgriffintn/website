import { PageLayout } from '@/components/PageLayout';
import { InnerPage } from '@/components/InnerPage';
import { SignInComponent } from './component';

export const metadata = {
  title: 'Sign In',
  description: 'Log in with your account',
};

export default async function SignInHome() {
  return (
    <PageLayout>
      <InnerPage>
        <SignInComponent />
      </InnerPage>
    </PageLayout>
  );
}
