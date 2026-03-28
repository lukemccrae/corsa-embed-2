import { initializeApp, type FirebaseApp } from "firebase/app";
import type { FirebaseConfig, CorsaWindow } from "./types";

export type { FirebaseConfig };

function getFirebaseConfig(): FirebaseConfig {
  const runtimeConfig = (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.firebase;
  if (runtimeConfig) {
    return runtimeConfig;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
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
