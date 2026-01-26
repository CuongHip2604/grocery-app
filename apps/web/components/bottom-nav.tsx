'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { SettingsDrawer } from './settings-drawer';

const navItems = [
  {
    href: '/dashboard',
    label: 'Trang chủ',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/scan',
    label: 'Quét mã',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 8h4M4 8h2m10-4h4m-6 4V4" />
      </svg>
    ),
  },
  {
    href: '/products',
    label: 'Sản phẩm',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

// Pages that are in the drawer menu
const drawerPages = ['/categories', '/customers', '/inventory', '/reports'];

export function BottomNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Check if current page is one of the drawer menu items
  const isDrawerPageActive = drawerPages.some(
    (page) => pathname === page || pathname.startsWith(page + '/')
  );

  return (
    <>
      <SettingsDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background pb-safe">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
              isDrawerPageActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
