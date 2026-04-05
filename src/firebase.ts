import { initializeApp, type FirebaseApp } from "firebase/app";
import type { FirebaseConfig, CorsaWindow } from "./types";

export type { FirebaseConfig };

function getFirebaseConfig(): FirebaseConfig {
  const runtimeConfig = (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.firebase;
  if (runtimeConfig) {
    return runtimeConfig;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCIvoY1WDwgeYHOcNePJH6DQGkrkloR3xQ",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "corsa-auth.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "corsa-auth",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };
}

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(getFirebaseConfig());
  }
  return _app;
}
