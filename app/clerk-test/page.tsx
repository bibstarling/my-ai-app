'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function ClerkTestPage() {
  const auth = useAuth();
  const userQuery = useUser();
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Check for Clerk in window
    if (typeof window !== 'undefined') {
      const clerkErrors = [];
      
      if (!(window as any).Clerk) {
        clerkErrors.push('Clerk not found on window object');
      }
      
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      if (!publishableKey) {
        clerkErrors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found');
      } else {
        clerkErrors.push(`Publishable Key: ${publishableKey.substring(0, 20)}...`);
      }
      
      setErrors(clerkErrors);
    }
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clerk Configuration Test</h1>
        
        {/* Environment Check */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>Publishable Key:</strong>{' '}
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                <span className="text-green-600">✓ Found</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </div>
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
              <div className="text-xs text-muted-foreground">
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 30)}...
              </div>
            )}
          </div>
        </div>

        {/* Auth State */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth State</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <strong className="w-32">isLoaded:</strong>
              <span className={auth.isLoaded ? 'text-green-600' : 'text-yellow-600'}>
                {auth.isLoaded ? '✓ True' : '⏳ False'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <strong className="w-32">isSignedIn:</strong>
              <span className={auth.isSignedIn ? 'text-green-600' : 'text-gray-600'}>
                {auth.isSignedIn ? '✓ True' : '✗ False'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <strong className="w-32">userId:</strong>
              <span className="text-sm font-mono">
                {auth.userId || 'null'}
              </span>
            </div>
          </div>
        </div>

        {/* User Data */}
        <div className="bg-white rounded-lg border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Query State</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <strong className="w-32">isLoaded:</strong>
              <span className={userQuery.isLoaded ? 'text-green-600' : 'text-yellow-600'}>
                {userQuery.isLoaded ? '✓ True' : '⏳ False'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <strong className="w-32">isSignedIn:</strong>
              <span className={userQuery.isSignedIn ? 'text-green-600' : 'text-gray-600'}>
                {userQuery.isSignedIn ? '✓ True' : '✗ False'}
              </span>
            </div>
            {userQuery.user && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <strong>User Email:</strong> {userQuery.user.primaryEmailAddress?.emailAddress}
              </div>
            )}
          </div>
        </div>

        {/* Errors/Warnings */}
        {errors.length > 0 && (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <ul className="space-y-2 text-sm">
              {errors.map((error, i) => (
                <li key={i} className="font-mono">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
          <ul className="space-y-2 text-sm">
            <li>✓ <strong>isLoaded</strong> should become <strong>true</strong> within 2-5 seconds</li>
            <li>✓ If not signed in, <strong>isSignedIn</strong> should be <strong>false</strong></li>
            <li>✓ If signed in, you should see your email address</li>
          </ul>
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <strong>If isLoaded stays false:</strong>
            <ul className="mt-2 space-y-1 text-sm ml-4">
              <li>• Check browser console for Clerk errors (F12)</li>
              <li>• Verify domain in Clerk Dashboard matches: www.applausejobs.com</li>
              <li>• Check Network tab for failed Clerk API calls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
