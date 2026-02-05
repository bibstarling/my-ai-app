'use client';

import { useUser } from '@clerk/nextjs';
import { useEmbedMode } from '@/app/ClientAuthWrapper';

/**
 * Safe wrapper around Clerk's useUser that works in embed mode
 * Returns mock user data when in embed/preview mode
 */
export function useAuthSafe() {
  const isEmbed = useEmbedMode();
  
  // In embed mode, return mock data to prevent errors
  if (isEmbed) {
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
      isEmbedMode: true,
    };
  }
  
  // Normal mode: use actual Clerk data
  const { user, isLoaded, isSignedIn } = useUser();
  return {
    user,
    isLoaded,
    isSignedIn,
    isEmbedMode: false,
  };
}
