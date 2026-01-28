'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, ShoppingBag, Wallet, Info, Bell, X } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationsAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useUnreadNotificationCount,
} from '../../../lib/hooks';
import { Spinner } from '../../../components/ui';
import { NotificationType, Notification } from '../../../lib/api';
import { cn } from '../../../lib/utils';

const typeConfig: Record<NotificationType, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  LOW_STOCK: {
    label: 'Tồn kho',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  SALE: {
    label: 'Bán hàng',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  PAYMENT: {
    label: 'Thanh toán',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: <Wallet className="h-5 w-5" />,
  },
  SYSTEM: {
    label: 'Hệ thống',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: <Info className="h-5 w-5" />,
  },
};

type FilterType = 'all' | 'unread';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useNotifications({
    limit: 50,
    ...(filter === 'unread' && { isRead: false }),
  });
  const { data: unreadData } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationsAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.data || [];
  const unreadCount = unreadData?.count || 0;

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate([notification.id]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 safe-top">
        <div className="flex items-center h-14 px-4 gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-lg font-semibold">Thông báo</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="text-sm text-primary font-medium active:opacity-70"
            >
              {markAllAsRead.isPending ? <Spinner size="sm" /> : 'Đọc tất cả'}
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 gap-2 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'h-8 px-4 text-sm font-medium rounded-full transition-colors',
              filter === 'all'
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground active:bg-muted/80'
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'h-8 px-4 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5',
              filter === 'unread'
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground active:bg-muted/80'
            )}
          >
            Chưa đọc
            {unreadCount > 0 && (
              <span className={cn(
                'min-w-5 h-5 px-1 text-xs font-bold rounded-full flex items-center justify-center',
                filter === 'unread'
                  ? 'bg-background text-foreground'
                  : 'bg-destructive text-destructive-foreground'
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-muted-foreground text-center">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              return (
                <div
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    'flex gap-3 px-4 py-3 active:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-primary/5'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    config.bgColor,
                    config.color
                  )}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start gap-2">
                      <p className={cn(
                        'flex-1 text-sm leading-snug',
                        !notification.isRead ? 'font-medium' : 'text-muted-foreground'
                      )}>
                        <span className="font-semibold">{notification.title}</span>
                        {' '}
                        <span className={!notification.isRead ? 'text-foreground' : ''}>
                          {notification.body}
                        </span>
                      </p>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    disabled={deletingId === notification.id}
                    className="flex-shrink-0 w-8 h-8 -mr-1 flex items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                  >
                    {deletingId === notification.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
