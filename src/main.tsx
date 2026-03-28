import React from "react"; // needed for JSX in IIFE/non-module context
import { createRoot } from "react-dom/client";
import App from "./App";

/**
 * Auto-mount logic:
 *
 * Finds the <script> tag that loaded this bundle, reads
 * data-username and data-stream-id, creates a container div
 * immediately after the script tag, and mounts the React app.
 *
 * Example embed snippet:
 *   <script
 *     src="https://your-cdn/bundle.js"
 *     data-username="luke"
 *     data-stream-id="abc123"
 *   ></script>
 */
function mount() {
  // Locate the script tag that loaded this bundle.
  // During initial execution `document.currentScript` is available.
  // After the module is parsed we fall back to the last script tag.
  const scriptEl =
    (document.currentScript as HTMLScriptElement | null) ??
    [...document.querySelectorAll<HTMLScriptElement>("script[data-username]")].at(
      -1
    );

  if (!scriptEl) {
    console.error("[CorsaEmbed] Could not locate the embedding <script> tag.");
    return;
  }

  const username = scriptEl.dataset.username;
  const streamId = scriptEl.dataset.streamId;
  const mountSelector = scriptEl.dataset.mount;

  if (!username || !streamId) {
    console.error(
      "[CorsaEmbed] Missing data-username or data-stream-id attributes on the <script> tag."
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
    container.id = `corsa-embed-${streamId}`;
    container.className = "corsa-embed-container";
    scriptEl.parentNode?.insertBefore(container, scriptEl.nextSibling);
  }

  createRoot(container).render(
    <React.StrictMode>
      <App username={username} streamId={streamId} />
    </React.StrictMode>
  );
}

// Expose a global API for manual / re-mounting scenarios
interface MountOptions {
  elementId?: string;
  container?: HTMLElement;
  username: string;
  streamId: string;
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
      <App username={options.username} streamId={options.streamId} />
    </React.StrictMode>
  );
}

// Attach to window for external access
(window as Window & { CorsaEmbed?: { mount: typeof mountTo } }).CorsaEmbed = {
  mount: mountTo,
};

// Auto-mount when the script runs
mount();

