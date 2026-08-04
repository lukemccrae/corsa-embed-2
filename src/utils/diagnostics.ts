import { domain } from "../context/domain.context";

/**
 * Debug logging for the Corsa embed.
 *
 * All verbose diagnostics are compiled in ONLY when the bundle is built with
 * VITE_EMBED_DEBUG=true (see package.json `update:debug`). Production builds
 * (`yarn update`) compile every log statement out, so hosts never see them.
 */

const DEBUG_BUILD = import.meta.env.VITE_EMBED_DEBUG === "true";

/** True when this bundle was built with debug logging enabled. */
export { DEBUG_BUILD };

/** Returns true when this bundle was built with debug logging enabled. */
export function isDebugBuild(): boolean {
  return DEBUG_BUILD;
}

/** Logs to the console only in debug builds. Safe to call anywhere. */
export function ceDebug(...args: unknown[]): void {
  if (!DEBUG_BUILD) return;
  console.log(...args);
}

type CorsaDebugWindow = Window & {
  __CORSA_EMBED_CONFIG__?: {
    debug?: boolean;
  };
};

/**
 * Whether verbose diagnostics should run.
 * Requires a debug build; can be force-disabled at runtime via
 * window.__CORSA_EMBED_CONFIG__.debug = false, or force-enabled per-page
 * with a `data-debug` attribute on the embedding <script> tag.
 */
function debugEnabled(scriptEl?: HTMLScriptElement | null): boolean {
  if (!DEBUG_BUILD) return false;
  const cfg = (window as CorsaDebugWindow).__CORSA_EMBED_CONFIG__;
  if (cfg?.debug === false) return false;
  if (scriptEl?.hasAttribute("data-debug")) return true;
  return true;
}

/** Collects a plain, serializable summary of the host page/environment. */
function collectEnvironment(
  scriptEl?: HTMLScriptElement | null,
): Record<string, unknown> {
  const externalUrls = {
    appsync: domain.appsync,
    utilityApi: domain.utilityApi,
    geoJsonCdn: domain.geoJsonCdnBaseUrl,
    userImagesCdn: domain.userImagesCdnBaseUrl,
    postImagesCdn: domain.postImagesCdnBaseUrl,
    mapTiles: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    leafletAssets: "https://unpkg.com/leaflet@1.9.4/dist/images/...",
    primeThemeCss: "https://unpkg.com/primereact/resources/themes/...",
  };

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  let sandbox: string | null = null;
  try {
    if (inIframe && window.frameElement) {
      sandbox = window.frameElement.getAttribute("sandbox");
    }
  } catch {
    sandbox = "unreadable (cross-origin iframe)";
  }

  let storageOk = true;
  try {
    localStorage.setItem("__corsa_debug__", "1");
    localStorage.removeItem("__corsa_debug__");
  } catch {
    storageOk = false;
  }

  const baseEl = document.querySelector<HTMLBaseElement>("base");

  return {
    pageUrl: location.href,
    pageOrigin: location.origin,
    pageProtocol: location.protocol,
    referrer: document.referrer,
    inIframe,
    iframeSandbox: sandbox,
    localStorageAvailable: storageOk,
    cookiesEnabled: navigator.cookieEnabled,
    baseTagHref: baseEl ? baseEl.href : "(none)",
    contentType: document.contentType,
    cspMetaTags: [
      ...document.querySelectorAll<HTMLMetaElement>("meta[http-equiv]"),
    ].map((m) => m.outerHTML),
    bundleScriptSrc: scriptEl?.src ?? "(unknown)",
    runtimeConfigPresent: !!(window as CorsaDebugWindow)
      .__CORSA_EMBED_CONFIG__,
    externalEndpoints: externalUrls,
  };
}

/**
 * Logs a compact summary of the page/environment the embed is running in.
 * Useful for diagnosing host pages that block or interfere with the embed's
 * assets (CSP, <base> tag, sandboxed iframes, host CSS, etc.).
 */
export function logHostEnvironment(scriptEl?: HTMLScriptElement | null): void {
  if (!debugEnabled(scriptEl)) return;

  const env = collectEnvironment(scriptEl);
  console.groupCollapsed(
    "%c[CorsaEmbed] Host environment",
    "color:#e53935;font-weight:bold",
  );
  console.log("Page URL:", env.pageUrl);
  console.log("Page origin:", env.pageOrigin);
  console.log("Page protocol:", env.pageProtocol);
  console.log("Referrer:", env.referrer);
  console.log("Running in iframe:", env.inIframe);
  console.log("Iframe sandbox attr:", env.iframeSandbox);
  console.log("localStorage available:", env.localStorageAvailable);
  console.log("Cookies enabled:", env.cookiesEnabled);
  console.log("<base> tag href:", env.baseTagHref);
  console.log("Content type:", env.contentType);
  console.log("CSP meta tags:", env.cspMetaTags);
  console.log("Bundle script src:", env.bundleScriptSrc);
  console.log("Runtime config present:", env.runtimeConfigPresent);
  console.log("External endpoints embed depends on:", env.externalEndpoints);
  console.groupEnd();
}

/**
 * Returns resources that were rejected outright (duration 0, 0 bytes
 * transferred) – the signature of a CSP/ad-blocker/host interference block.
 * In-flight requests the page voluntarily aborted (e.g. Leaflet discarding
 * out-of-view map tiles, which shows as NS_BINDING_ABORTED) have duration > 0
 * and are intentionally NOT included here.
 */
function collectResourceIssues(): Array<Record<string, unknown>> {
  try {
    const entries = performance.getEntriesByType("resource") as
      | PerformanceResourceTiming[]
      | undefined;
    if (!entries?.length) return [];
    return entries
      .filter((e) => {
        if (!e.name.startsWith("http")) return false;
        // Instant rejection: never got a response and spent ~no time in flight.
        return e.transferSize === 0 && e.duration === 0;
      })
      .map((e) => ({
        url: e.name,
        durationMs: Math.round(e.duration),
        transferBytes: e.transferSize,
      }));
  } catch {
    return [];
  }
}

/**
 * Logs resources that were rejected outright (duration 0, 0 bytes transferred)
 * – the signature of a CSP/ad-blocker/host interference block. In-flight
 * requests the page voluntarily aborted (e.g. Leaflet discarding out-of-view
 * map tiles, which shows as NS_BINDING_ABORTED) have duration > 0 and are
 * intentionally NOT flagged here.
 */
export function logResourceLoadIssues(): void {
  if (!debugEnabled()) return;

  const issues = collectResourceIssues();
  if (issues.length) {
    console.groupCollapsed(
      "%c[CorsaEmbed] Resources rejected by the page (likely CSP / host interference)",
      "color:#e53935;font-weight:bold",
    );
    console.table(issues);
    console.log(
      "In-flight aborts (map tiles scrolling out of view, NS_BINDING_ABORTED) are normal and are not listed here.",
    );
    console.groupEnd();
  }
}

/**
 * Monitors the page for resource load failures (img/link/script) and logs them.
 * Returns an unsubscribe function.
 */
export function startResourceErrorMonitor(): () => void {
  if (!debugEnabled()) return () => {};
  const handler = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName;
    if (tag !== "IMG" && tag !== "LINK" && tag !== "SCRIPT" && tag !== "IFRAME") {
      return;
    }
    const src =
      (target as HTMLImageElement).currentSrc ||
      target.getAttribute("src") ||
      target.getAttribute("href") ||
      "";
    if (!/^https?:/i.test(src)) return;

    const style = getComputedStyle(target);
    console.error(
      `[CorsaEmbed] Asset failed to load: <${tag.toLowerCase()}> ${src}`,
      {
        element: target,
        currentSrc: (target as HTMLImageElement).currentSrc || src,
        visibleSize: {
          clientWidth: (target as HTMLElement).clientWidth,
          clientHeight: (target as HTMLElement).clientHeight,
        },
        css: {
          display: style.display,
          visibility: style.visibility,
          width: style.width,
          height: style.height,
        },
      },
    );
  };
  window.addEventListener("error", handler, true);
  return () => window.removeEventListener("error", handler, true);
}

/**
 * Inspects the live-profile photo marker: does the embed's CSS actually apply,
 * did the image load, and is any host rule overriding its size?
 * Returns a serializable object (or null when the marker is not on the page).
 */
function collectMarkerInspection(): Record<string, unknown> | null {
  const img = document.querySelector<HTMLImageElement>(
    ".ce-profile-map-marker__img",
  );
  if (!img) {
    return {
      found: false,
      note:
        "The map profile marker only renders when isLive === true; if the stream is not live there is nothing to inspect.",
    };
  }

  // Did the embed's own CSS rules actually get injected/load? If the host
  // CSP blocks inline <style>, every embed rule is missing and the marker
  // falls back to unstyled defaults (natural image size).
  let embedCssRuleFound = false;
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin stylesheet – not ours, skip
      }
      for (const rule of Array.from(rules)) {
        const sel = (rule as CSSStyleRule).selectorText;
        if (sel && sel.includes("ce-profile-map-marker")) {
          embedCssRuleFound = true;
        }
      }
    }
  } catch {
    /* ignore */
  }

  const parent = img.parentElement;
  const pStyle = parent ? getComputedStyle(parent) : null;
  const imgStyle = getComputedStyle(img);

  return {
    found: true,
    src: img.currentSrc || img.getAttribute("src"),
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    imgRenderedSize: { clientWidth: img.clientWidth, clientHeight: img.clientHeight },
    imgCss: {
      display: imgStyle.display,
      visibility: imgStyle.visibility,
      opacity: imgStyle.opacity,
      width: imgStyle.width,
      height: imgStyle.height,
      "object-fit": imgStyle.objectFit,
    },
    parentMarkerCss: {
      width: pStyle?.width,
      height: pStyle?.height,
      border: pStyle?.borderWidth,
      borderRadius: pStyle?.borderRadius,
      overflow: pStyle?.overflow,
      backgroundColor: pStyle?.backgroundColor,
      animation: pStyle?.animationName,
    },
    embedCssRulePresent: embedCssRuleFound,
  };
}

/**
 * Inspects the live-profile photo marker after the map has rendered.
 * Distinguishes "image failed to load" from "image loaded but hidden by CSS"
 * (e.g. host-page styles overriding the embed).
 */
export function inspectProfileMapMarker(): void {
  if (!debugEnabled()) return;
  window.setTimeout(() => {
    const data = collectMarkerInspection();
    if (!data || data.found !== true) {
      console.warn(
        "[CorsaEmbed] No .ce-profile-map-marker__img found on the page. " +
          "The map profile marker only renders when isLive === true; if the " +
          "stream is not live there is nothing to inspect.",
      );
      return;
    }
    console.groupCollapsed(
      "%c[CorsaEmbed] Profile map marker inspection",
      "color:#e53935;font-weight:bold",
    );
    console.log("src:", data.src);
    console.log("complete:", data.complete);
    console.log("naturalWidth:", data.naturalWidth);
    console.log("naturalHeight:", data.naturalHeight);
    console.log("img rendered size:", data.imgRenderedSize);
    console.log("img css:", data.imgCss);
    console.log("parent .ce-profile-map-marker css:", data.parentMarkerCss);
    console.log(
      "embed CSS rule '.ce-profile-map-marker' present in document.styleSheets:",
      data.embedCssRulePresent,
    );
    if (
      (data.imgCss as Record<string, string>).width &&
      (data.imgCss as Record<string, string>).width !==
        (data.parentMarkerCss as Record<string, string>).width
    ) {
      console.log(
        "note: img renders larger than its 44px container, so host CSS is overriding the marker sizing.",
      );
    }
    console.log(
      "element:",
      document.querySelector<HTMLImageElement>(".ce-profile-map-marker__img"),
    );
    console.groupEnd();
  }, 2000);
}

let lastScriptEl: HTMLScriptElement | null = null;

/** Copies text to the clipboard (async API with a legacy textarea fallback). */
function copyTextToClipboard(text: string): boolean {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => {},
      () => fallbackCopy(text),
    );
    return true;
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Assembles every diagnostic into a single JSON object, prints it as one
 * copyable block, and attempts to copy it to the clipboard automatically.
 * Also exposed on the global `CorsaEmbed.copyDiagnostics()` so it can be
 * re-run from the host page's console at any time.
 */
export function logCopyableDiagnostics(
  scriptEl?: HTMLScriptElement | null,
): void {
  if (!debugEnabled(scriptEl)) return;
  if (scriptEl) lastScriptEl = scriptEl;

  const payload = {
    generatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    environment: collectEnvironment(lastScriptEl),
    resourceIssues: collectResourceIssues(),
    profileMapMarker: collectMarkerInspection(),
  };

  const json = JSON.stringify(payload, null, 2);

  console.log(
    "%c[CorsaEmbed] DIAGNOSTICS — copy the JSON block below into the support thread",
    "color:#e53935;font-weight:bold;font-size:14px",
  );
  console.log(json);
  if (copyTextToClipboard(json)) {
    console.log(
      "[CorsaEmbed] JSON copied to clipboard. If it did not paste, copy the block above manually.",
    );
  } else {
    console.log(
      "[CorsaEmbed] Clipboard unavailable — select and copy the JSON block above manually.",
    );
  }
}
