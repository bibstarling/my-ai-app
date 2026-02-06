'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export function WerkRoomButton() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-accent/90 hover:shadow-xl"
    >
      <LayoutDashboard className="h-4 w-4" />
      <span>Werk Room</span>
    </Link>
  );
}
