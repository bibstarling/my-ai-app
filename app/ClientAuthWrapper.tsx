'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const EmbedModeContext = createContext(false);

export function useEmbedMode() {
  return useContext(EmbedModeContext);
}

function isEmbedded() {
  if (typeof window === 'undefined') return true;
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
  const [mounted, setMounted] = useState(false);
  const [embed, setEmbed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEmbed(isEmbedded());
  }, []);

  // Server: always use ClerkProvider so pages using useUser() can prerender
  if (typeof window === 'undefined') {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <EmbedModeContext.Provider value={false}>
          {children}
        </EmbedModeContext.Provider>
      </ClerkProvider>
    );
  }

  // Client + embed (e.g. v0 preview): never load Clerk; mark embed so auth pages can show fallback
  if (mounted && embed) {
    return (
      <EmbedModeContext.Provider value={true}>
        {children}
      </EmbedModeContext.Provider>
    );
  }

  // Client + not embedded OR not yet mounted: always wrap with ClerkProvider
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <EmbedModeContext.Provider value={embed}>
        {children}
      </EmbedModeContext.Provider>
    </ClerkProvider>
  );
}
