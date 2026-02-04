'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/approach', label: 'Approach' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'bibstarling@gmail.com';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-foreground">
          Bianca Starling
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? 'text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-muted hover:text-foreground transition-colors">
                Log in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            {isAdmin && (
              <Link
                href="/assistant"
                className={`text-sm transition-colors ${
                  pathname === '/assistant'
                    ? 'text-accent'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Assistant
              </Link>
            )}
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
