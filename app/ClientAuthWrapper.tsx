'use client';

import { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

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
  const [embed, setEmbed] = useState(true);

  useEffect(() => {
    setMounted(true);
    setEmbed(isEmbedded());
  }, []);

  // In embed (e.g. v0 preview): never load Clerk so the preview works without browser restrictions
  if (!mounted || embed) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
