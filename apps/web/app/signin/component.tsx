'use client';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/Spinner';
import { handleGetSession } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/data/db/schema';

export function SignInComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleGetSession().then((data) => {
      if (!data.user) {
        setLoading(false);
        return;
      }

      setUser(data.user as User);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (user?.email) {
    return (
      <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
        You're already signed in!
      </h1>
    );
  }

  return (
    <>
      <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
        Sign In
      </h1>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
          <div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
            <p>Click on your chosen provider below to sign in:</p>
            <div>
              <form method="GET" className="flex flex-col gap-2">
                <Button
                  formAction="/api/auth/github"
                  type="submit"
                  variant="outline"
                  size="lg"
                >
                  Sign in with GitHub
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
