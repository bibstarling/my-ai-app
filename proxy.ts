import { clerkMiddleware } from '@clerk/nextjs/server';

// Configure Clerk to use satellite domain mode for proper cookie sharing
export default clerkMiddleware({
  // This ensures cookies work across www.applausejobs.com and clerk.applausejobs.com
  isSatellite: false,
  // Domain is inferred from the publishable key
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
