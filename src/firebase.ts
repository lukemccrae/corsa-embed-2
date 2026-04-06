import { initializeApp, type FirebaseApp } from "firebase/app";
import type { FirebaseConfig, CorsaWindow } from "./types";

export type { FirebaseConfig };

/**
 * Returns true only when `value` is a non-empty string that is not the
 * literal text "undefined". Vite occasionally writes the word "undefined"
 * into the bundle for env vars that were not set at build time, which would
 * otherwise be treated as a truthy, non-empty string by `||` fallbacks.
 */
function isPresent(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0 && value !== "undefined";
}

/**
 * Resolves the Firebase configuration from, in priority order:
 *  1. Runtime config injected by the host page via `window.__CORSA_EMBED_CONFIG__.firebase`
 *  2. Build-time Vite env vars (`VITE_FIREBASE_*`)
 *  3. Bundled production defaults for the corsa-auth Firebase project
 *
 * Returns both the resolved config and a human-readable source label used for
 * logging so it is easy to diagnose which path was taken.
 */
export function getFirebaseConfig(): { config: FirebaseConfig; source: string } {
  // Priority 1 – runtime override provided by the host page.
  const runtimeConfig = (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.firebase;
  if (runtimeConfig && isPresent(runtimeConfig.apiKey)) {
    return { config: runtimeConfig, source: "runtime (window.__CORSA_EMBED_CONFIG__)" };
  }

  // Priority 2 – build-time env vars injected by Vite.
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  if (isPresent(envApiKey)) {
    return {
      source: "build-time env vars (VITE_FIREBASE_*)",
      config: {
        apiKey: envApiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
        appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
      },
    };
  }

  // Priority 3 – bundled production defaults for the corsa-auth Firebase project.
  // These allow the embed to work out of the box without any additional configuration.
  // Override via window.__CORSA_EMBED_CONFIG__.firebase or VITE_FIREBASE_* env vars.
  return {
    source: "bundled defaults",
    config: {
      apiKey: "AIzaSyCIvoY1WDwgeYHOcNePJH6DQGkrkloR3xQ",
      authDomain: "corsa-auth.firebaseapp.com",
      projectId: "corsa-auth",
      storageBucket: "corsa-auth.appspot.com",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    },
  };
}

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    const { config, source } = getFirebaseConfig();

    if (!isPresent(config.apiKey)) {
      throw new Error(
        `[CorsaEmbed] Firebase apiKey is missing or invalid (source: ${source}). ` +
          "Provide it via window.__CORSA_EMBED_CONFIG__.firebase.apiKey or the " +
          "VITE_FIREBASE_API_KEY build-time env var. See README for details."
      );
    }

    console.debug(`[CorsaEmbed] Initializing Firebase from ${source}.`);
    _app = initializeApp(config);
  }
  return _app;
}
