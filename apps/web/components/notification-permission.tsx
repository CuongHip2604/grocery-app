'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { Button } from './ui';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  initializeFirebaseApp,
} from '../lib/firebase';
import { useRegisterPushToken } from '../lib/hooks';

interface NotificationPermissionProps {
  className?: string;
}

export function NotificationPermission({ className }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerToken = useRegisterPushToken();

  useEffect(() => {
    // Initialize Firebase
    initializeFirebaseApp();

    // Check support and permission
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      // Show banner if permission not yet requested
      if (currentPermission === 'default') {
        // Delay showing banner to not overwhelm new users
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      } else if (currentPermission === 'granted') {
        // Auto-register token if already granted
        registerTokenSilently();
      }
    }
  }, []);

  // Handle foreground messages
  useEffect(() => {
    if (permission === 'granted') {
      const unsubscribe = onForegroundMessage((payload: unknown) => {
        const data = payload as { notification?: { title?: string; body?: string } };
        // Show a toast or in-app notification for foreground messages
        if (data.notification) {
          // You can integrate with a toast library here
          console.log('Foreground notification:', data.notification);
        }
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [permission]);

  const registerTokenSilently = async () => {
    try {
      const token = await getFCMToken();
      if (token) {
        await registerToken.mutateAsync(token);
      }
    } catch (err) {
      console.error('Failed to register token:', err);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        const token = await getFCMToken();
        if (token) {
          await registerToken.mutateAsync(token);
        }
        setShowBanner(false);
      } else if (result === 'denied') {
        setError('Thong bao bi tu choi. Vui long kiem tra cai dat trinh duyet.');
      }
    } catch (err) {
      console.error('Failed to request permission:', err);
      setError('Khong the bat thong bao. Vui long thu lai.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  if (!isSupported) {
    return null;
  }

  // Compact status indicator for header
  if (permission === 'granted') {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${className || ''}`}>
        <Bell className="h-4 w-4" />
        <Check className="h-3 w-3" />
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-1 text-gray-400 ${className || ''}`}>
        <BellOff className="h-4 w-4" />
      </div>
    );
  }

  // Permission banner
  if (!showBanner) {
    return (
      <button
        onClick={() => setShowBanner(true)}
        className={`flex items-center gap-1 text-gray-500 hover:text-gray-700 ${className || ''}`}
      >
        <Bell className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Bat thong bao</h3>
            <p className="text-sm text-gray-600 mt-1">
              Nhan thong bao khi san pham sap het hang de kip thoi nhap them.
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleRequestPermission}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Dang xu ly...' : 'Cho phep'}
              </Button>
              <Button
                onClick={dismissBanner}
                variant="ghost"
                size="sm"
              >
                De sau
              </Button>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
