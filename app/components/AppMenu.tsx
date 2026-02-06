'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Home,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Search,
  Kanban,
  Mail,
  User,
  Settings,
  Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthSafe } from '@/app/hooks/useAuthSafe';
import { useTranslations } from 'next-intl';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
};

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  show: boolean;
};

function Tooltip({ content, children, show }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!show) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {content}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

const getMenuItems = (t: (key: string) => string): MenuItem[] => [
  { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, href: '/assistant' },
  { id: 'portfolio-builder', label: t('portfolioBuilder'), icon: <Briefcase className="w-5 h-5" />, href: '/portfolio/builder' },
  { id: 'job-search', label: t('jobSearch'), icon: <Search className="w-5 h-5" />, href: '/assistant/job-search' },
  { id: 'my-jobs', label: t('myJobs'), icon: <Kanban className="w-5 h-5" />, href: '/assistant/my-jobs' },
  { id: 'chat', label: t('aiAssistant'), icon: <MessageSquare className="w-5 h-5" />, href: '/assistant/chat' },
  { id: 'resume', label: t('resumeBuilder'), icon: <FileText className="w-5 h-5" />, href: '/resume-builder' },
  { id: 'cover-letter', label: t('coverLetters'), icon: <Mail className="w-5 h-5" />, href: '/cover-letters' },
  { id: 'settings', label: t('settings'), icon: <Settings className="w-5 h-5" />, href: '/assistant/settings' },
];

type AppMenuProps = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};

export function AppMenu({ isCollapsed, setIsCollapsed }: AppMenuProps) {
  const pathname = usePathname();
  const t = useTranslations('menu');
  const menuItems = getMenuItems(t);
  const { user, isEmbedMode } = useAuthSafe();

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
                <span className="font-semibold text-gray-900 text-sm">{t('controlRoom')}</span>
                <span className="text-xs text-gray-500">{t('jobTools')}</span>
              </div>
            </Link>
          ) : (
            <Tooltip content={t('controlRoom')} show={isCollapsed}>
              <Link href="/assistant" className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  B
                </div>
              </Link>
            </Tooltip>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.id} content={item.label} show={isCollapsed}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {/* User Profile */}
          {!isEmbedMode && user && (
            <Tooltip 
              content={user.firstName || user.emailAddresses[0]?.emailAddress || t('profile')} 
              show={isCollapsed}
            >
              <div className={`flex items-center gap-3 px-3 py-2.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}>
                <UserButton
                  afterSignOutUrl="/assistant"
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                      userButtonPopoverCard: 'shadow-xl',
                    },
                  }}
                />
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName || user.emailAddresses[0]?.emailAddress}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {user.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          
          {/* Embed Mode Indicator */}
          {isEmbedMode && (
            <Tooltip content={t('previewMode')} show={isCollapsed}>
              <div className={`flex items-center gap-3 px-3 py-2.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900">{t('previewMode')}</span>
                    <span className="text-xs text-gray-500">{t('authDisabled')}</span>
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          
          {/* Back to Portfolio Link */}
          <Tooltip content={t('portfolio')} show={isCollapsed}>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <Home className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">{t('portfolio')}</span>}
            </Link>
          </Tooltip>
          
          {/* Collapse Toggle */}
          <Tooltip content={isCollapsed ? t('expandMenu') : t('collapseMenu')} show={isCollapsed}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('collapse')}</span>
                </>
              )}
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
