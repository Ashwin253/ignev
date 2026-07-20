import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration placeholder - add your credentials below
const firebaseConfig = {
apiKey: "AIzaSyCGDphstRMJlQyXoozX7MB8yd0QeuH0lkY",
  authDomain: "evplseweb.firebaseapp.com",
  projectId: "evplseweb",
  storageBucket: "evplseweb.firebasestorage.app",
  messagingSenderId: "890087562093",
  appId: "1:890087562093:web:4ddc67f8e2123cbffb1864",
  measurementId: "G-RKYSMNLHD4"
};

// Initialize Firebase client app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export key Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Safe initialization of Analytics (client-side only)
const analytics = typeof window !== "undefined"
  ? isSupported().then((yes) => yes ? getAnalytics(app) : null)
  : null;

export { app, auth, db, analytics };
