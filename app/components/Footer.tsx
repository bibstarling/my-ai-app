'use client';

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Bianca Starling. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
