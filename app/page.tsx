'use client';

import { useState, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user, isLoaded } = useUser();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);

  useEffect(() => {
    const checkUserApproval = async () => {
      if (!user) return;

      setCheckingApproval(true);

      // Check if user exists in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (existingUser) {
        setIsApproved(existingUser.approved);
      } else {
        // Create new user as pending
        await supabase.from('users').insert({
          email: user.primaryEmailAddress?.emailAddress,
          clerk_id: user.id,
          approved: false,
        });
        setIsApproved(false);
      }

      setCheckingApproval(false);
    };

    if (user) {
      checkUserApproval();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: Could not get response');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gray-950 text-white">
        <div className="max-w-xl w-full">
          <h1 className="text-2xl font-semibold mb-4">Auth loading state (temporary debug)</h1>
          <pre className="text-xs whitespace-pre-wrap bg-gray-900 p-4 rounded border border-gray-700">
            {JSON.stringify(
              {
                isLoaded,
                hasUser: !!user,
                host: typeof window !== 'undefined' ? window.location.host : null,
              },
              null,
              2
            )}
          </pre>
          <p className="mt-4 text-gray-400">
            This is a temporary debug view to inspect Clerk&apos;s loading state in production.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-950">
      <div className="absolute top-4 right-4">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      <SignedOut>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8 text-white">
            Chat with Claude 🤖
          </h1>
          <p className="text-gray-400 mb-8">Please sign in to continue</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {checkingApproval ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-white">Checking your access...</div>
          </div>
        ) : (
          <>
            {isApproved === false && (
              <div className="text-center max-w-md">
                <h1 className="text-4xl font-bold mb-4 text-white">
                  Access Pending ⏳
                </h1>
                <p className="text-gray-400 mb-4">
                  Your account is awaiting approval from the administrator.
                </p>
                <p className="text-gray-500 text-sm">
                  You&apos;ll be able to use the chat once approved.
                </p>
              </div>
            )}

            {isApproved === true && (
              <div className="w-full max-w-2xl">
                <h1 className="text-4xl font-bold mb-8 text-center text-white">
                  Chat with Claude 🤖
                </h1>

                <form onSubmit={handleSubmit} className="mb-8">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask Claude anything..."
                    className="w-full p-4 border border-gray-700 rounded-lg mb-4 min-h-[100px] bg-gray-900 text-white"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Thinking...' : 'Send Message'}
                  </button>
                </form>

                {response && (
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                    <h2 className="font-bold mb-2 text-white">Claude&apos;s Response:</h2>
                    <p className="whitespace-pre-wrap text-gray-300">{response}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </SignedIn>
    </main>
  );
}