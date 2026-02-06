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
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const pathname = usePathname();
  const { isOnboardingOpen, closeOnboarding } = useOnboarding();
  
  // Only show menu on tool pages (not on the portfolio home page or login page)
  // Check if pathname ends with locale or is the home page (e.g., /en, /pt-BR, /en/, /pt-BR/)
  const isHomePage = pathname === '/' || /^\/(en|pt-BR)\/?$/.test(pathname);
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');
  const showMenu = !isHomePage && !isLoginPage && !pathname.startsWith('/_') && !pathname.startsWith('/api');

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
        <div className="flex flex-1">
          {showMenu && <AppMenu isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
          <main className={`flex-1 transition-all duration-300 ${showMenu ? (isCollapsed ? 'ml-16' : 'ml-64') : ''}`}>
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

        {/* Floating AI Assistant Button (only show when menu is visible) */}
        {showMenu && !isAIAssistantOpen && (
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
            title="Open AI Assistant (Cmd+K)"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Ask AI</span>
            <kbd className="hidden group-hover:inline-block ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">
              ⌘K
            </kbd>
          </button>
        )}
      </div>
    </MenuContext.Provider>
  );
}
