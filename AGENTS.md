# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

A single-file browser embed (`dist-singlefile/bundle.js`) that renders a live
activity stream (map, profile, chat, posts) on third-party host pages. It is
built with Vite + React + TypeScript and deployed to S3/CloudFront, served at a
fixed URL (`corsa-bundle.js`). Host pages load it with a `<script src>` tag plus
`data-*` attributes.

Because it runs on arbitrary host pages, host-page CSS, CSP, iframes, and
scripts can interfere with it. Debugging those issues is a core workflow here.

## Commands

- `yarn dev` — Vite dev server
- `yarn build` — typecheck + build to `dist-singlefile/bundle.js`
- `yarn update` — build + upload to S3 + invalidate CloudFront (PRODUCTION, quiet)
- `yarn update:debug` — same, but builds with `VITE_EMBED_DEBUG=true`
- `yarn lint` — ESLint (note: `eslint.config.js` is currently broken; see below)
- `yarn codegen` — regenerate `src/generated/schema.ts`

## The debug/deploy loop (IMPORTANT)

There is a single bundle URL. A debug build and a production build are the SAME
URL, so deploying a debug build overwrites production and `yarn update`
switches it back off. This is intentional and is the documented workflow:

1. Host reports a problem → run `yarn update:debug`.
2. Have the host open DevTools console; the embed logs diagnostics and prints a
   copyable JSON blob (auto-copied to clipboard when permitted).
3. The host pastes the JSON into the thread. Agent reads it and diagnoses.
4. Fix → run `yarn update` to redeploy the quiet production bundle.

Per-page knobs (only meaningful in a debug build):
- `window.__CORSA_EMBED_CONFIG__.debug = false` — disable logging on a page.
- `<script ... data-debug>` — force logging on just that page.
- `CorsaEmbed.copyDiagnostics()` in the host console — re-print/re-copy the JSON.

## How the debug flag works

`VITE_EMBED_DEBUG` is build-time only. `vite.config.ts` always `define`s
`import.meta.env.VITE_EMBED_DEBUG` as the literal string `"true"` or `"false"`,
so esbuild folds `if (DEBUG_BUILD)` and rollup tree-shakes the entire
`src/utils/diagnostics.ts` module out of production bundles. Keep every call to
the diagnostics module inside an `if (DEBUG_BUILD)` guard so production stays
clean (verified: no debug strings in the prod bundle).

- `DEBUG_BUILD` / `isDebugBuild()` — compile-time gate (exported from
  `src/utils/diagnostics.ts`).
- `ceDebug(...)` — console helper that only exists in debug builds.
- `logHostEnvironment(scriptEl)` — host env summary (page URL, iframe/sandbox,
  `<base>` tag, CSP meta tags, cookies/localStorage, endpoints).
- `startResourceErrorMonitor()` — capture-phase `error` listener; logs failed
  `img/link/script` loads with computed CSS (distinguishes blocked vs hidden).
- `logResourceLoadIssues()` — `console.table` of resources rejected outright
  (0 bytes, 0 duration). In-flight aborts (Leaflet map tiles →
  `NS_BINDING_ABORTED`) have duration > 0 and are intentionally excluded.
- `inspectProfileMapMarker()` / `collectMarkerInspection()` — does the profile
  photo load (`naturalWidth`) and is host CSS overriding the 44px marker
  (`parentMarkerCss` + `embedCssRulePresent`).
- `logCopyableDiagnostics(scriptEl)` — one JSON object of everything above,
  logged as a single copyable block + clipboard copy.

## Debugging field reports

Interpret the JSON from the host:

- **Profile box image fine, map marker huge/missing** → host CSS overrides the
  map marker. `imgRenderedSize` will be 320×320 (natural size) while
  `parentMarkerCss.width` is 44px. Fix in `src/embed.css`: anchor rules to
  `.leaflet-marker-icon` and pin sizes with `!important`
  (see `.ce-profile-map-marker__img`). Never ship marker sizing that host CSS
  can beat on specificity/order.
- **Map tiles show `NS_BINDING_ABORTED`** → normal Leaflet behavior (map
  churn from `fitBounds`/`invalidateSize`), not a host block.
- **`embedCssRulePresent: false`** → host CSP is blocking the embed's injected
  inline `<style>`; all embed styles are missing, not just the marker.
- **`resourceIssues` non-empty** → CSP/ad-blocker blocking those exact URLs.

## CSS / theming conventions

- All CSS is injected at runtime from `src/embed.css` (no separate file).
- Because host CSS can collide, prefer prefixed, specific selectors
  (`ce-*` classes) and be willing to add `!important` for critical sizing.
- Tailwind utilities are bundled too (used alongside `ce-*` classes).

## Gotchas

- `yarn lint` currently crashes (`eslint.config.js` reads an undefined
  `recommended`). Typecheck via `yarn build` instead until that config is fixed.
- `import.meta.env` is typed via `vite/client` in `tsconfig.app.json`.
- Leaflet CSS + PrimeReact theme CSS load from unpkg at runtime; keep those
  domains in mind when a host reports "assets blocked".
