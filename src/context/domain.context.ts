import type { CorsaWindow } from "../types";
import { defaultConfig } from "../config";

/**
 * Runtime-injectable CDN / endpoint overrides.
 * Set via window.__CORSA_EMBED_CONFIG__.domain before the bundle loads.
 */
interface RuntimeDomainOverrides {
  appsyncEndpoint?: string;
  appsyncRealtimeEndpoint?: string;
  utilityApi?: string;
  geoJsonCdnBaseUrl?: string;
  userImagesCdnBaseUrl?: string;
  postImagesCdnBaseUrl?: string;
  cdnBase?: string;
}

// Runtime config injected by the host page before the bundle loads takes
// priority over build-time environment variables.
const runtimeDomain =
  (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.domain as
    | RuntimeDomainOverrides
    | undefined;

export const domain = {
    appsync: runtimeDomain?.appsyncEndpoint ?? import.meta.env.VITE_APPSYNC_ENDPOINT ?? defaultConfig.domain.appsyncEndpoint,
    utilityApi: (runtimeDomain?.utilityApi ?? import.meta.env.VITE_UTILITY_API_ENDPOINT ?? "https://hpju2h9n7h.execute-api.us-west-1.amazonaws.com/prod/").replace(/\/$/, ""),
    geoJsonCdnBaseUrl: (runtimeDomain?.geoJsonCdnBaseUrl ?? import.meta.env.VITE_GEOJSON_CDN_BASE_URL ?? "https://d2mg2mxj6r88wt.cloudfront.net").replace(/\/$/, ""),
    userImagesCdnBaseUrl: (runtimeDomain?.userImagesCdnBaseUrl ?? import.meta.env.VITE_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
    postImagesCdnBaseUrl: (runtimeDomain?.postImagesCdnBaseUrl ?? import.meta.env.VITE_POST_IMAGES_CDN_BASE_URL ?? import.meta.env.VITE_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
}