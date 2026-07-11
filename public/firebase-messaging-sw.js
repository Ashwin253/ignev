// Web Service Worker for Firebase Cloud Messaging compat
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Parse Firebase config from the URL query params passed during registration
const urlParams = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Listen to background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const title = payload.notification?.title || 'New Lead Notification';
    const options = {
      body: payload.notification?.body || 'A new request has been generated.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data
    };

    self.registration.showNotification(title, options);
  });
} else {
  console.warn('[firebase-messaging-sw.js] SW loaded without complete Firebase credentials.');
}
