import { redirect } from 'next/navigation';
import { PageLayout } from '@/components/PageLayout';
import { InnerPage } from '@/components/InnerPage';
import { SignInForm } from '@/components/SignInForm';
import { getAuthSession } from "@/lib/auth";

export const metadata = {
  title: 'Sign In',
  description: 'Log in with your account',
};

export default async function SignInHome() {
	const { user } = await getAuthSession({
		refreshCookie: false,
	});

	if (user) {
		return redirect('/');
  }

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
          Sign In
        </h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
            <div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
              <p>Click on your chosen provider below to sign in:</p>
              <div>
                <SignInForm />
              </div>
            </div>
          </div>
        </div>
      </InnerPage>
    </PageLayout>
  );
}
