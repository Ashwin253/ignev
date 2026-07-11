import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client app (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const requestFcmToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.warn("FCM Messaging is not supported in this browser environment.");
      return null;
    }

    // Request notification permission if not already granted
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied by user.");
        return null;
      }
    }

    const messaging = getMessaging(app);

    // Register our Firebase Service Worker with config credentials in URL search parameters
    const swUrl = `/firebase-messaging-sw.js` +
      `?apiKey=${encodeURIComponent(firebaseConfig.apiKey || "")}` +
      `&authDomain=${encodeURIComponent(firebaseConfig.authDomain || "")}` +
      `&projectId=${encodeURIComponent(firebaseConfig.projectId || "")}` +
      `&storageBucket=${encodeURIComponent(firebaseConfig.storageBucket || "")}` +
      `&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || "")}` +
      `&appId=${encodeURIComponent(firebaseConfig.appId || "")}`;

    const registration = await navigator.serviceWorker.register(swUrl);
    
    // Retrieve FCM registration token using VAPID key and registered SW
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    return token;
  } catch (err) {
    console.error("Error retrieving FCM device token:", err);
    return null;
  }
};
