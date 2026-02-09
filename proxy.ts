import { clerkMiddleware } from '@clerk/nextjs/server';

// Configure Clerk with custom domain for cookie handling
export default clerkMiddleware({
  // Clerk custom domain configuration
  domain: 'clerk.applausejobs.com',
  isSatellite: false,
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
