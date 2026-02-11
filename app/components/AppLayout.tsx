'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppMenu } from './AppMenu';
import { OnboardingTour } from './OnboardingTour';
import { InteractiveOnboarding } from './InteractiveOnboarding';
import { GlobalAIAssistant } from './GlobalAIAssistant';
import { useOnboarding } from '../hooks/useOnboarding';
import { Sparkles } from 'lucide-react';

const MenuContext = createContext({ isCollapsed: false, setIsCollapsed: (value: boolean) => {} });

export function useMenuContext() {
  return useContext(MenuContext);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const pathname = usePathname();
  const { isOnboardingOpen, closeOnboarding } = useOnboarding();
  
  // Only show menu on tool pages (not on the portfolio home page or login page)
  // Check if pathname ends with locale or is the home page (e.g., /en, /pt-BR, /en/, /pt-BR/)
  const isHomePage = pathname === '/' || /^\/(en|pt-BR)\/?$/.test(pathname);
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');
  const isPortfolioBuilder = pathname === '/portfolio/builder';
  const showMenu = !isHomePage && !isLoginPage && !pathname.startsWith('/_') && !pathname.startsWith('/api');

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIAssistantOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MenuContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Mobile Header with Hamburger */}
        {showMenu && (
          <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-gradient-primary text-base">Applause</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {showMenu && isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className="flex flex-1">
          {showMenu && (
            <AppMenu 
              isCollapsed={isCollapsed} 
              setIsCollapsed={setIsCollapsed}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          )}
          <main className={`flex-1 transition-all duration-300 ${showMenu ? 'md:ml-16 lg:ml-64' : ''}`}>
            {children}
          </main>
        </div>
        
        {/* Global onboarding tour - auto-launches for new users */}
        <OnboardingTour isOpen={isOnboardingOpen} onClose={closeOnboarding} autoStart />
        
        {/* Interactive step-by-step tour with page navigation */}
        <InteractiveOnboarding />

        {/* Global AI Assistant - accessible from anywhere */}
        <GlobalAIAssistant 
          isOpen={isAIAssistantOpen} 
          onClose={() => setIsAIAssistantOpen(false)} 
        />

        {/* Floating AI Assistant Button (only show when menu is visible, but not on portfolio builder) */}
        {showMenu && !isAIAssistantOpen && !isPortfolioBuilder && (
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-[#e07a5f] to-[#3b82f6] px-5 py-3 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all group border-2 border-white/20"
            title="Open AI Assistant (Cmd+K)"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium drop-shadow-sm">Ask AI</span>
            <kbd className="hidden group-hover:inline-block ml-1 px-1.5 py-0.5 bg-white/30 border border-white/40 rounded text-xs font-mono">
              ⌘K
            </kbd>
          </button>
        )}
      </div>
    </MenuContext.Provider>
  );
}
