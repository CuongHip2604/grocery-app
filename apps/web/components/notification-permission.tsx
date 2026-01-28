'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  initializeFirebaseApp,
  onForegroundMessage,
} from '../lib/firebase';
import { useRegisterPushToken } from '../lib/hooks';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    if (!isNotificationSupported()) return;

    initializeFirebaseApp();
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      registerTokenSilently();
    } else if (currentPermission === 'default') {
      const timer = setTimeout(() => setShowModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle foreground messages (needed for Android Chrome)
  // Only show notification when app is in foreground and NOT running as standalone PWA
  useEffect(() => {
    if (permission !== 'granted') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Skip foreground handler for standalone PWA (iOS) - service worker handles it
    if (isStandalone) return;

    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const data = payload as { notification?: { title?: string; body?: string } };
      if (data.notification) {
        new Notification(data.notification.title || 'Thông báo', {
          body: data.notification.body,
          icon: '/icon-192.png',
        });
      }
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [permission]);


  const registerTokenSilently = async () => {
    try {
      const token = await getFCMToken();
      if (token) {
        await registerToken.mutateAsync(token);
      }
    } catch {
      // Silent fail
    }
  };

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        const token = await getFCMToken();
        if (token) {
          await registerToken.mutateAsync(token);
        }
      }
      setShowModal(false);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  if (!showModal || permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: '90%',
        maxWidth: '360px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            backgroundColor: '#EEF2FF',
            borderRadius: '50%',
            padding: '10px',
            flexShrink: 0,
          }}
        >
          <Bell style={{ width: '20px', height: '20px', color: '#4F46E5' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>
            Bật thông báo
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Nhận thông báo khi sản phẩm sắp hết hàng để kịp thời nhập thêm.
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleAllow}
              disabled={isLoading}
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isLoading ? 'Đang xử lý...' : 'Cho phép'}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Để sau
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: '#999',
          }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </div>
  );
}
