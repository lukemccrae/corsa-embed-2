// Domain types for the stream page

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarKey?: string;
  totalDistance?: number;
  totalActivities?: number;
  followerCount?: number;
  followingCount?: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp?: string;
  heartRate?: number;
  pace?: number;
  cadence?: number;
}

export interface Post {
  id: string;
  content: string;
  imageKey?: string;
  createdAt: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarKey?: string;
  likeCount?: number;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  status: "LIVE" | "COMPLETED" | "SCHEDULED" | string;
  startTime?: string;
  endTime?: string;
  distance?: number;
  duration?: number;
  elevationGain?: number;
  userId: string;
  username: string;
  coverImageKey?: string;
  coordinates?: Coordinate[];
  posts?: { items: Post[] };
}

export interface ChatMessage {
  id: string;
  streamId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarKey?: string;
  message: string;
  createdAt: string;
}

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
  };
}

