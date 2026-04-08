import React from "react"; // needed for JSX in IIFE/non-module context
import { createRoot } from "react-dom/client";
import App from "./App";

/**
 * Auto-mount logic:
 *
 * Finds the <script> tag that loaded this bundle, reads data attributes,
 * creates a container div immediately after the script tag, and mounts
 * the React app.
 *
 * Stream embed example:
 *   <script
 *     src="https://your-cdn/bundle.js"
 *     data-username="luke"
 *     data-stream-id="abc123"
 *   ></script>
 *
 * Route embed example:
 *   <script
 *     src="https://your-cdn/bundle.js"
 *     data-username="luke"
 *     data-route-id="route456"
 *     data-view="route"
 *   ></script>
 */
function mount() {
  // Locate the script tag that loaded this bundle.
  // During initial execution `document.currentScript` is available.
  // After the module is parsed we fall back to finding the last relevant tag.
  const scriptEl =
    (document.currentScript as HTMLScriptElement | null) ??
    [
      ...document.querySelectorAll<HTMLScriptElement>(
        "script[data-username]"
      ),
    ].at(-1);

  if (!scriptEl) {
    console.error("[CorsaEmbed] Could not locate the embedding <script> tag.");
    return;
  }

  const username = scriptEl.dataset.username;
  const streamId = scriptEl.dataset.streamId;
  const routeId = scriptEl.dataset.routeId;
  const view = scriptEl.dataset.view as "stream" | "route" | undefined;
  const mountSelector = scriptEl.dataset.mount;

  // Resolve feedMaxHeight: data-max-height attr > window config > default (600)
  const runtimeConfig = (window as Window & { __CORSA_EMBED_CONFIG__?: { 
    feedMaxHeight?: number;
    components?: {
      map?: boolean;
      posts?: boolean;
      elevation?: boolean;
      route?: boolean;
      profile?: boolean;
      chat?: boolean;
    };
  } }).__CORSA_EMBED_CONFIG__;
  const feedMaxHeight =
    scriptEl.dataset.maxHeight !== undefined
      ? Number(scriptEl.dataset.maxHeight)
      : runtimeConfig?.feedMaxHeight ?? 600;
  
  // Extract component visibility settings
  const components = runtimeConfig?.components ?? {};

  if (!username) {
    console.error(
      "[CorsaEmbed] Missing data-username attribute on the <script> tag."
    );
    return;
  }

  if (!streamId && !routeId) {
    console.error(
      "[CorsaEmbed] Missing data-stream-id or data-route-id on the <script> tag."
    );
    return;
  }

  // If data-mount is provided, mount into that existing element; otherwise
  // create a new container div immediately after the script tag.
  let container: HTMLElement | null = null;
  if (mountSelector) {
    container = document.querySelector<HTMLElement>(mountSelector);
    if (!container) {
      console.error(
        `[CorsaEmbed] data-mount target "${mountSelector}" not found in the document.`
      );
      return;
    }
  } else {
    container = document.createElement("div");
    container.id = `corsa-embed-${streamId ?? routeId}`;
    container.className = "corsa-embed-container";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    scriptEl.parentNode?.insertBefore(container, scriptEl.nextSibling);
  }

  createRoot(container).render(
    <React.StrictMode>
      <App
        username={username}
        streamId={streamId}
        routeId={routeId}
        view={view}
        feedMaxHeight={feedMaxHeight}
        components={components}
      />
    </React.StrictMode>
  );
}

// Expose a global API for manual / re-mounting scenarios
interface MountOptions {
  elementId?: string;
  container?: HTMLElement;
  username: string;
  streamId?: string;
  routeId?: string;
  view?: "stream" | "route";
  feedMaxHeight?: number;
  components?: {
    map?: boolean;
    posts?: boolean;
    elevation?: boolean;
    route?: boolean;
    profile?: boolean;
    chat?: boolean;
  };
}

function mountTo(options: MountOptions) {
  const el =
    options.container ??
    (options.elementId ? document.getElementById(options.elementId) : null);

  if (!el) {
    console.error("[CorsaEmbed] Target element not found.");
    return;
  }

  createRoot(el).render(
    <React.StrictMode>
      <App
        username={options.username}
        streamId={options.streamId}
        routeId={options.routeId}
        view={options.view}
        feedMaxHeight={options.feedMaxHeight}
        components={options.components}
      />
    </React.StrictMode>
  );
}

// Attach to window for external access
(window as Window & { CorsaEmbed?: { mount: typeof mountTo } }).CorsaEmbed = {
  mount: mountTo,
};

// Auto-mount when the script runs
mount();
