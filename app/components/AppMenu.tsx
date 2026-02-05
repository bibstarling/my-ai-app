'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Search,
  Kanban,
} from 'lucide-react';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
};

const getMenuItems = (): MenuItem[] => [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/assistant' },
  { id: 'job-search', label: 'Job Search', icon: <Search className="w-5 h-5" />, href: '/assistant/job-search' },
  { id: 'my-jobs', label: 'My Jobs', icon: <Kanban className="w-5 h-5" />, href: '/assistant/my-jobs' },
  { id: 'chat', label: 'AI Assistant', icon: <MessageSquare className="w-5 h-5" />, href: '/assistant/chat' },
  { id: 'resume', label: 'Resume Builder', icon: <FileText className="w-5 h-5" />, href: '/resume-builder' },
  { id: 'cover-letter', label: 'Cover Letters', icon: <FileText className="w-5 h-5" />, href: '/cover-letters' },
];

type AppMenuProps = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};

export function AppMenu({ isCollapsed, setIsCollapsed }: AppMenuProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          {!isCollapsed ? (
            <Link href="/assistant" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 text-sm">Control Room</span>
                <span className="text-xs text-gray-500">Job Tools</span>
              </div>
            </Link>
          ) : (
            <Link href="/assistant" className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                B
              </div>
            </Link>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {/* Back to Portfolio Link */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Portfolio' : undefined}
          >
            <Home className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-medium">Portfolio</span>}
          </Link>
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
