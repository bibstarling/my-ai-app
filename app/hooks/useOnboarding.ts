'use client';

import { useState, useEffect } from 'react';
import { useAuthSafe } from './useAuthSafe';

const ONBOARDING_SHOWN_KEY = 'onboarding_has_been_shown';

export function useOnboarding() {
  const { user } = useAuthSafe();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    if (!user || hasChecked) return;

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          const completed = data.settings?.onboarding_completed || false;
          setOnboardingCompleted(completed);
          
          // Auto-launch onboarding ONLY if:
          // 1. User hasn't completed it in the database
          // 2. We haven't shown it to them before (checked via localStorage)
          const hasBeenShown = localStorage.getItem(ONBOARDING_SHOWN_KEY) === 'true';
          
          if (!completed && !hasBeenShown) {
            // Small delay to let the UI settle
            setTimeout(() => {
              setIsOnboardingOpen(true);
              // Mark that we've shown the onboarding to prevent showing again
              localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setHasChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [user, hasChecked]);

  const startOnboarding = () => {
    // This is for manual triggers (from menu), so we bypass the "has been shown" check
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = async () => {
    setIsOnboardingOpen(false);
    
    // Mark onboarding as completed in the database
    try {
      await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ onboarding_completed: true }),
      });
      
      // Update local state
      setOnboardingCompleted(true);
      
      // Ensure localStorage flag is set
      localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
    }
  };

  return {
    isOnboardingOpen,
    onboardingCompleted,
    startOnboarding,
    closeOnboarding,
  };
}
