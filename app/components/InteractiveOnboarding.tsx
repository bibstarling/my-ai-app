'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TourSpotlight } from './TourSpotlight';
import { interactiveOnboardingSteps } from '@/lib/interactive-tour-steps';

const STORAGE_KEY = 'applause_tour_state';

type TourState = {
  isActive: boolean;
  currentStep: number;
  startedAt: number;
};

export function InteractiveOnboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const [tourState, setTourState] = useState<TourState | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load tour state from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state = JSON.parse(stored) as TourState;
        setTourState(state);
      } catch (e) {
        console.error('Failed to parse tour state:', e);
      }
    }
    setIsReady(true);
  }, []);

  // Save tour state to sessionStorage
  useEffect(() => {
    if (tourState) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tourState));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [tourState]);

  // Check if we should show the current step
  useEffect(() => {
    if (!tourState?.isActive || !isReady) return;

    const currentStepData = interactiveOnboardingSteps[tourState.currentStep];
    if (!currentStepData) return;

    // If we're not on the right page, navigate there
    if (currentStepData.page !== pathname) {
      router.push(currentStepData.page);
    }
  }, [tourState, pathname, router, isReady]);

  const handleNext = () => {
    if (!tourState) return;

    const nextStep = tourState.currentStep + 1;
    
    if (nextStep >= interactiveOnboardingSteps.length) {
      // Tour complete
      handleComplete();
    } else {
      setTourState({
        ...tourState,
        currentStep: nextStep,
      });
    }
  };

  const handlePrevious = () => {
    if (!tourState) return;

    const prevStep = Math.max(0, tourState.currentStep - 1);
    setTourState({
      ...tourState,
      currentStep: prevStep,
    });
  };

  const handleSkip = () => {
    setTourState(null);
    
    // Mark onboarding as completed
    fetch('/api/users/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ onboarding_completed: true }),
    }).catch(console.error);
  };

  const handleComplete = () => {
    setTourState(null);
    
    // Mark onboarding as completed
    fetch('/api/users/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ onboarding_completed: true }),
    }).catch(console.error);
  };

  // Don't render until we've loaded state and we're on the right page
  if (!isReady || !tourState?.isActive) return null;

  const currentStepData = interactiveOnboardingSteps[tourState.currentStep];
  if (!currentStepData) return null;

  // Don't render if we're not on the correct page
  if (currentStepData.page !== pathname) return null;

  return (
    <TourSpotlight
      targetSelector={currentStepData.targetSelector}
      title={currentStepData.title}
      description={currentStepData.description}
      icon={currentStepData.icon}
      step={tourState.currentStep + 1}
      totalSteps={interactiveOnboardingSteps.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      showNext={true}
      showPrevious={tourState.currentStep > 0}
      position={currentStepData.position}
    />
  );
}

// Export function to start the tour
export function startInteractiveTour() {
  const tourState: TourState = {
    isActive: true,
    currentStep: 0,
    startedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tourState));
  
  // Trigger a storage event to notify the component
  window.dispatchEvent(new Event('storage'));
  
  // Reload to start tour
  window.location.href = interactiveOnboardingSteps[0].page;
}

// Export function to check if tour is active
export function isTourActive(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  try {
    const state = JSON.parse(stored) as TourState;
    return state.isActive;
  } catch {
    return false;
  }
}
