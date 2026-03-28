import type { DomainConfig, CorsaWindow } from "../types";

export type { DomainConfig };

function getDomainConfig(): DomainConfig {
  const runtimeConfig = (window as CorsaWindow).__CORSA_EMBED_CONFIG__?.domain;
  if (runtimeConfig) {
    return runtimeConfig;
  }

  return {
    appsyncEndpoint: import.meta.env.VITE_APPSYNC_ENDPOINT as string,
    appsyncRealtimeEndpoint: import.meta.env
      .VITE_APPSYNC_REALTIME_ENDPOINT as string,
    cdnBase: (import.meta.env.VITE_CDN_BASE as string) ?? "",
  };
}

export const domainConfig = getDomainConfig();
