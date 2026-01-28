'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Bug } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  initializeFirebaseApp,
} from '../lib/firebase';
import { useRegisterPushToken } from '../lib/hooks';
import { api } from '../lib/api';

interface DebugInfo {
  supported: boolean;
  permission: string;
  token: string | null;
  tokenError: string | null;
  registerStatus: string | null;
  backendStatus: {
    firebaseInitialized?: boolean;
    registeredTokens?: number;
    hasProjectId?: boolean;
    hasClientEmail?: boolean;
    hasPrivateKey?: boolean;
  } | null;
  testResult: string | null;
}

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supported: false,
    permission: 'unknown',
    token: null,
    tokenError: null,
    registerStatus: null,
    backendStatus: null,
    testResult: null,
  });
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    const supported = isNotificationSupported();
    setDebugInfo(prev => ({ ...prev, supported }));

    if (!supported) return;

    initializeFirebaseApp();
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);
    setDebugInfo(prev => ({ ...prev, permission: currentPermission || 'null' }));

    if (currentPermission === 'granted') {
      registerTokenSilently();
    } else if (currentPermission === 'default') {
      const timer = setTimeout(() => setShowModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
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
    }
  }, [permission]);

  const registerTokenSilently = async () => {
    try {
      const token = await getFCMToken();
      setDebugInfo(prev => ({ ...prev, token: token ? token.substring(0, 20) + '...' : null }));
      if (token) {
        await registerToken.mutateAsync(token);
        setDebugInfo(prev => ({ ...prev, registerStatus: 'success' }));
      } else {
        setDebugInfo(prev => ({ ...prev, tokenError: 'No token returned' }));
      }
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        tokenError: err instanceof Error ? err.message : 'Unknown error',
        registerStatus: 'failed'
      }));
    }
  };

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      setDebugInfo(prev => ({ ...prev, permission: result }));
      if (result === 'granted') {
        const token = await getFCMToken();
        setDebugInfo(prev => ({ ...prev, token: token ? token.substring(0, 20) + '...' : null }));
        if (token) {
          await registerToken.mutateAsync(token);
          setDebugInfo(prev => ({ ...prev, registerStatus: 'success' }));
        } else {
          setDebugInfo(prev => ({ ...prev, tokenError: 'No token returned' }));
        }
      }
      setShowModal(false);
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        tokenError: err instanceof Error ? err.message : 'Unknown error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  const checkBackendStatus = async () => {
    try {
      const status = await api.getNotificationStatus();
      setDebugInfo(prev => ({ ...prev, backendStatus: status }));
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        backendStatus: { firebaseInitialized: false },
        testResult: `Status error: ${err instanceof Error ? err.message : 'Unknown'}`
      }));
    }
  };

  const sendTestNotification = async () => {
    setDebugInfo(prev => ({ ...prev, testResult: 'Sending...' }));
    try {
      const result = await api.sendTestNotification();
      if (result.error) {
        setDebugInfo(prev => ({ ...prev, testResult: `Error: ${result.error}` }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          testResult: `Success: ${result.success}, Failed: ${result.failed}${result.errors?.length ? ` - ${result.errors.join(', ')}` : ''}`
        }));
      }
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        testResult: `Error: ${err instanceof Error ? err.message : 'Unknown'}`
      }));
    }
  };

  const debugPanel = showDebug && (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 99999,
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '320px',
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Frontend</div>
      <div>Supported: {debugInfo.supported ? '✅' : '❌'}</div>
      <div>Permission: {debugInfo.permission}</div>
      <div>Token: {debugInfo.token || 'none'}</div>
      {debugInfo.tokenError && <div style={{ color: '#ff6b6b' }}>Error: {debugInfo.tokenError}</div>}
      <div>Register: {debugInfo.registerStatus || 'pending'}</div>

      <div style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '8px' }}>Backend</div>
      {debugInfo.backendStatus ? (
        <>
          <div>Firebase: {debugInfo.backendStatus.firebaseInitialized ? '✅' : '❌'}</div>
          <div>Tokens: {debugInfo.backendStatus.registeredTokens}</div>
          <div>ProjectId: {debugInfo.backendStatus.hasProjectId ? '✅' : '❌'}</div>
          <div>ClientEmail: {debugInfo.backendStatus.hasClientEmail ? '✅' : '❌'}</div>
          <div>PrivateKey: {debugInfo.backendStatus.hasPrivateKey ? '✅' : '❌'}</div>
        </>
      ) : (
        <div style={{ color: '#888' }}>Click Check Status</div>
      )}

      {debugInfo.testResult && (
        <div style={{ marginTop: '8px', color: debugInfo.testResult.includes('Error') ? '#ff6b6b' : '#4ade80' }}>
          {debugInfo.testResult}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={checkBackendStatus}
          style={{ fontSize: '10px', cursor: 'pointer', padding: '4px 8px' }}
        >
          Check Status
        </button>
        <button
          onClick={sendTestNotification}
          style={{ fontSize: '10px', cursor: 'pointer', padding: '4px 8px' }}
        >
          Send Test
        </button>
        <button
          onClick={() => setShowDebug(false)}
          style={{ fontSize: '10px', cursor: 'pointer', padding: '4px 8px' }}
        >
          Close
        </button>
      </div>
    </div>
  );

  const debugButton = (
    <button
      onClick={() => setShowDebug(true)}
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 99998,
        backgroundColor: '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Bug style={{ width: '20px', height: '20px' }} />
    </button>
  );

  if (!showModal || permission === 'granted' || permission === 'denied') {
    return (
      <>
        {debugButton}
        {debugPanel}
      </>
    );
  }

  return (
    <>
      {debugButton}
      {debugPanel}
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
    </>
  );
}
