'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationsAsRead,
} from '../lib/hooks';
import { Spinner, Button } from './ui';
import { Notification, NotificationType } from '../lib/api';
import { cn } from '../lib/utils';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  LOW_STOCK: (
    <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  SALE: (
    <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  PAYMENT: (
    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  SYSTEM: (
    <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  return `${Math.floor(seconds / 86400)} ngày trước`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: countData } = useUnreadNotificationCount();
  const { data: notificationsData, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkNotificationsAsRead();

  const unreadCount = countData?.count || 0;
  const notifications = notificationsData?.data || [];

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync([notification.id]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="Thông báo"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleClose}
          />

          {/* Drawer Panel - Full width on mobile, fixed width on tablet+ */}
          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 sm:max-w-md h-full z-50 flex flex-col bg-background sm:shadow-xl sm:border-l">
            {/* Drawer Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-accent transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold">Thông báo</h2>
              </div>
              {unreadCount > 0 && (
                <span className="text-sm text-muted-foreground">{unreadCount} chưa đọc</span>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-auto min-h-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg className="h-16 w-16 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-muted-foreground text-lg">Không có thông báo</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'flex items-start gap-4 p-4 cursor-pointer hover:bg-accent transition-colors',
                        !notification.isRead && 'bg-primary/5'
                      )}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {typeIcons[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-base', !notification.isRead && 'font-semibold')}>
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex-shrink-0 p-4 border-t bg-background pb-safe">
              <Link href="/notifications" onClick={handleClose}>
                <Button variant="outline" className="w-full">
                  Xem tất cả thông báo
                </Button>
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
