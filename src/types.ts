// ---- Config types shared between firebase.ts and DomainContext.ts ----

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface DomainConfig {
  appsyncEndpoint: string;
  appsyncRealtimeEndpoint: string;
  cdnBase: string;
}

/**
 * Optional runtime configuration injected by the host page before the bundle
 * is loaded. Allows a single bundle to serve multiple environments.
 *
 * Example:
 *   <script>
 *     window.__CORSA_EMBED_CONFIG__ = {
 *       firebase: { apiKey: "...", ... },
 *       domain:   { appsyncEndpoint: "...", ... }
 *     };
 *   </script>
 */
export interface CorsaWindow extends Window {
  __CORSA_EMBED_CONFIG__?: {
    firebase?: FirebaseConfig;
    domain?: DomainConfig;
    /** Maximum height (px) of the feed/posts scroll region. Default: 600 */
    feedMaxHeight?: number;
    /** Maximum height (px) of the chat scroll region. Default: 420 */
    chatMaxHeight?: number;
  };
}

