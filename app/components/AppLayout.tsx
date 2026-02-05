'use client';

import { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AppMenu } from './AppMenu';

const MenuContext = createContext({ isCollapsed: false, setIsCollapsed: (value: boolean) => {} });

export function useMenuContext() {
  return useContext(MenuContext);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  
  // Only show menu on tool pages (not on the portfolio home page)
  const showMenu = pathname !== '/' && !pathname.startsWith('/_') && !pathname.startsWith('/api');

  return (
    <MenuContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen bg-gray-50">
        {showMenu && <AppMenu isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
        <main className={`flex-1 transition-all duration-300 ${showMenu ? (isCollapsed ? 'ml-16' : 'ml-64') : ''}`}>
          {children}
        </main>
      </div>
    </MenuContext.Provider>
  );
}
