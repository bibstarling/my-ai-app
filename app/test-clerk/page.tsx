'use client';

import { SignIn, SignUp, useAuth } from '@clerk/nextjs';
import { useState } from 'react';

export default function TestClerkPage() {
  const { isSignedIn, userId } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Signed In!</h1>
            <p className="text-gray-600 mb-2">User ID: {userId}</p>
            <p className="text-sm text-gray-500 mb-6">
              Clerk authentication is working correctly.
            </p>
            <a 
              href="/dashboard"
              className="inline-block bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Clerk Authentication Test Page</h1>
          <p className="text-gray-600 mb-4">
            This page helps diagnose Clerk sign-in/sign-up issues.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What to Look For:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Email input field should be visible</li>
              <li>✓ Password input field should be visible</li>
              <li>✓ "Continue with Google" button should be visible</li>
              <li>✓ Form should be clickable and functional</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sign In Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Sign In Component</h2>
            <div className={mode === 'signin' ? '' : 'opacity-50 pointer-events-none'}>
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-accent hover:bg-accent/90',
                    rootBox: 'w-full',
                    card: 'shadow-none w-full',
                  },
                }}
                routing="hash"
                fallbackRedirectUrl="/test-clerk"
              />
            </div>
          </div>

          {/* Sign Up Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Sign Up Component</h2>
            <div className={mode === 'signup' ? '' : 'opacity-50 pointer-events-none'}>
              <SignUp
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-accent hover:bg-accent/90',
                    rootBox: 'w-full',
                    card: 'shadow-none w-full',
                  },
                }}
                routing="hash"
                fallbackRedirectUrl="/test-clerk"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Debugging Tips:</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>
              <strong>Can't see email fields?</strong> Check Clerk Dashboard →
              User & Authentication → Email, Phone, Username → Enable "Email address" and "Password"
            </li>
            <li>
              <strong>Forms not working?</strong> Open browser console (F12) and look for JavaScript errors
            </li>
            <li>
              <strong>Verification email not arriving?</strong> Check spam folder and Clerk Dashboard → Logs
            </li>
            <li>
              <strong>Environment variables correct?</strong> Check .env.local has correct NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/login"
            className="text-accent hover:text-accent/80 font-medium"
          >
            ← Back to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}
