import { initializeApp, type FirebaseApp } from "firebase/app";
import type { FirebaseConfig, CorsaWindow } from "./types";
import { defaultConfig } from "./config";

export type { FirebaseConfig };

function getFirebaseConfig(): FirebaseConfig {
  const runtimeConfig = (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.firebase;
  if (runtimeConfig) {
    return runtimeConfig;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string || defaultConfig.firebase.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string || defaultConfig.firebase.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string || defaultConfig.firebase.projectId,
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
