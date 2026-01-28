'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { BottomNav } from '../../components/bottom-nav';
import { Spinner } from '../../components/ui';
import { NotificationPermission } from '../../components/notification-permission';
import { NotificationBell } from '../../components/notification-bell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header with notification bell */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-end px-4">
          <NotificationBell />
        </div>
      </header>
      <main>{children}</main>
      <BottomNav />
      <NotificationPermission />
    </div>
  );
}
