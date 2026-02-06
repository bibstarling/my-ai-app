'use client';

import { useState, useEffect } from 'react';
import { useAuthSafe } from './useAuthSafe';

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
          
          // Auto-launch onboarding for new users (only once per session)
          if (!completed && !sessionStorage.getItem('onboarding_prompted')) {
            // Small delay to let the UI settle
            setTimeout(() => {
              setIsOnboardingOpen(true);
              sessionStorage.setItem('onboarding_prompted', 'true');
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
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  return {
    isOnboardingOpen,
    onboardingCompleted,
    startOnboarding,
    closeOnboarding,
  };
}
