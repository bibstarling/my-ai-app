'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { X, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isLoaded } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Show timeout message if Clerk doesn't load in 10 seconds
  useEffect(() => {
    if (!isOpen) {
      setShowTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowTimeout(true);
        console.error('Clerk failed to load within 10 seconds');
        console.log('Current URL:', window.location.href);
        console.log('Clerk Publishable Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isOpen, isLoaded]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted" />
          </button>

          {/* Modal Content */}
          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Applause
              </h2>
              <p className="text-sm text-muted">
                Sign in or create your account to get started
              </p>
            </div>

            <div className="flex justify-center w-full">
              {!isLoaded && !showTimeout ? (
                <div className="w-full text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted">Loading authentication...</p>
                </div>
              ) : showTimeout ? (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-red-900 font-semibold mb-2">Unable to Load Sign In</div>
                      <p className="text-sm text-red-800 mb-3">
                        The authentication service is not responding. This is usually due to:
                      </p>
                      <ul className="text-sm text-red-800 space-y-1 mb-4 list-disc list-inside">
                        <li>Domain not configured in Clerk</li>
                        <li>API key mismatch</li>
                        <li>CORS configuration issue</li>
                      </ul>
                      <div className="text-xs text-red-700 bg-red-100 p-3 rounded font-mono mb-3">
                        Domain: {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <SignIn
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        'bg-accent hover:bg-accent/90 text-white',
                      card: 'shadow-none w-full',
                      rootBox: 'w-full',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'border-border hover:bg-muted/50 transition-colors',
                      socialButtonsBlockButtonText: 'font-medium',
                      formFieldInput:
                        'border-border focus:border-accent focus:ring-accent',
                      footerActionLink:
                        'text-accent hover:text-accent/80 font-medium',
                      identityPreviewText: 'font-medium',
                      formFieldLabel: 'font-medium',
                      otpCodeFieldInput: 'border-border focus:border-accent',
                      formResendCodeLink: 'text-accent hover:text-accent/80',
                      footer: 'hidden',
                    },
                    layout: {
                      socialButtonsPlacement: 'top',
                      socialButtonsVariant: 'blockButton',
                    },
                  }}
                  routing="hash"
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                />
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
