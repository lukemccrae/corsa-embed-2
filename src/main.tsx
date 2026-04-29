import React from "react"; // needed for JSX in IIFE/non-module context
import { createRoot } from "react-dom/client";
import App from "./App";

/**
 * Auto-mount logic:
 *
 * Finds the <script> tag that loaded this bundle, reads the
 * `data-corsa-public-id` attribute, and mounts the React app.
 * All embed configuration (settings, theme, username, streamId) is
 * fetched internally via getEmbedByPublicId — the host page only
 * needs to supply the publicId.
 *
 * Embed example:
 *   <script
 *     src="https://your-cdn/corsa-bundle.js"
 *     data-corsa-public-id="e3fcce22-6c1a-49af-ab63-df4850086b77"
 *     async
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
        "script[data-corsa-public-id]"
      ),
    ].at(-1);

  if (!scriptEl) {
    console.error("[CorsaEmbed] Could not locate the embedding <script> tag.");
    return;
  }

  const publicId = scriptEl.dataset.corsaPublicId;
  const mountSelector = scriptEl.dataset.mount;

  if (!publicId) {
    console.error(
      "[CorsaEmbed] Missing data-corsa-public-id attribute on the <script> tag."
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
    container.id = `corsa-embed-${publicId}`;
    container.className = "corsa-embed-container";
    container.style.width = "100%";
    container.style.boxSizing = "border-box";
    scriptEl.parentNode?.insertBefore(container, scriptEl.nextSibling);
  }

  createRoot(container).render(
    <React.StrictMode>
      <App publicId={publicId} />
    </React.StrictMode>
  );
}

// Expose a global API for manual / re-mounting scenarios
interface MountOptions {
  elementId?: string;
  container?: HTMLElement;
  publicId: string;
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
      <App publicId={options.publicId} />
    </React.StrictMode>
  );
}

// Attach to window for external access
(window as Window & { CorsaEmbed?: { mount: typeof mountTo } }).CorsaEmbed = {
  mount: mountTo,
};

// Auto-mount when the script runs
mount();

