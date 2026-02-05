'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const EmbedModeContext = createContext(false);

export function useEmbedMode() {
  return useContext(EmbedModeContext);
}

function isEmbedded() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function ClientAuthWrapper({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  publishableKey: string;
}) {
  const [embed, setEmbed] = useState(false);

  useEffect(() => {
    const embedded = isEmbedded();
    setEmbed(embedded);
    
    // Add visual indicator in embed mode
    if (embedded) {
      console.log('🔍 Running in embed mode (v0 preview) - Auth disabled');
    }
  }, []);

  // In embed mode, skip ClerkProvider entirely to avoid third-party cookie/auth issues
  if (embed) {
    return (
      <EmbedModeContext.Provider value={true}>
        {children}
      </EmbedModeContext.Provider>
    );
  }

  // Normal mode: wrap with ClerkProvider
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <EmbedModeContext.Provider value={false}>
        {children}
      </EmbedModeContext.Provider>
    </ClerkProvider>
  );
}
