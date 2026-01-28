// Firebase Cloud Messaging Service Worker
// This service worker handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: These values should match your Firebase config
// The service worker cannot access environment variables directly,
// so we initialize with empty values and let FCM handle it
firebase.initializeApp({
  apiKey: 'AIzaSyBPEE-0Eo-MvoKTkFHO19_gP32x3MWAuek',
  authDomain: 'grocery-6ad1e.firebaseapp.com',
  projectId: 'grocery-6ad1e',
  messagingSenderId: '891684654359',
  appId: '1:891684654359:web:a201b6983da4ec49b6bb52',
});

const messaging = firebase.messaging();

// Handle background messages (data-only messages from FCM)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Data is in payload.data for data-only messages
  const data = payload.data || {};
  const notificationTitle = data.title || 'Cảnh báo tồn kho';
  const notificationOptions = {
    body: data.body || 'Có sản phẩm sắp hết hàng',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'low-stock-notification',
    requireInteraction: true,
    data: data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const url = event.notification.data?.url || '/inventory';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(clients.claim());
});
