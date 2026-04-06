# Corsa Embed 2

A React + TypeScript + Vite embed library that renders a live activity stream (map, chat, posts, profile) for the Corsa platform.

The UI uses **PrimeReact** components with **Tailwind CSS** utility classes, styled to match the Corsa dark theme (dark blues and reds). All CSS is injected into the single-file JS bundle via `vite-plugin-css-injected-by-js` — no separate stylesheet is required.

## GraphQL Query Pattern

This embed uses the same `getUserByUserName` + `liveStreams(streamId: ...)` query pattern as [corsa-next](https://github.com/lukemccrae/corsa-next), fetching all required data in a single round-trip:

```typescript
const STREAM_PROFILE_QUERY = (username: string, streamId: string) => `
  query MyQuery {
    getUserByUserName(username: "${username}") {
      username
      profilePicture
      coverImagePath
      streamId
      bio
      live
      liveStreams(streamId: "${streamId}") {
        streamId
        mileMarker
        title
        startTime
        finishTime
        live
        currentLocation { lat lng }
        chatMessages { text createdAt publicUser { username profilePicture } }
        waypoints { lat lng altitude mileMarker timestamp }
        posts {
          ... on StatusPost { text imagePath createdAt userId }
        }
      }
    }
  }
`;
```

Real-time updates use the `onNewChat` and `onNewWaypoint` AppSync subscriptions.

All TypeScript types are sourced from `src/generated/schema.ts` (generated via GraphQL Code Generator).

## Embedding

### Recommended embed snippet

Use a wrapper `<div>` to control the embed's dimensions. The embed will fill its
container 100 % horizontally and grow vertically to fit its content.

```html
<!-- 1. Optional runtime config (must appear before bundle.js) -->
<script>
  window.__CORSA_EMBED_CONFIG__ = {
    feedMaxHeight: 600,           // px – max height of the scrollable posts list
    components: {                 // toggle individual sections on/off
      map: true,
      posts: true,
      elevation: true,
      route: true,
      profile: true
    }
  };
</script>

<!-- 2. Size the embed via a wrapper div, then load the bundle -->
<div style="width: 100%; max-width: 1200px;">
  <script
    src="https://your-cdn/bundle.js"
    data-username="alice"
    data-stream-id="stream-123"
  ></script>
</div>
```

The bundle inserts a `<div class="corsa-embed-container">` immediately after the
`<script>` tag and mounts the React app into it. That container is `width: 100%`
by default, so it fills whatever wrapper you provide.

#### Controlling height

The embed sizes itself to its content by default. To cap the overall height of
the widget, wrap it in a fixed-height div with `overflow: hidden` (or
`overflow: auto`):

```html
<div style="width: 100%; max-width: 1200px; height: 700px; overflow: hidden;">
  <script src="bundle.js" data-username="alice" data-stream-id="stream-123"></script>
</div>
```

#### Mounting into an existing element (`data-mount`)

If you prefer to mount the embed into a pre-existing element on the page, add
the `data-mount` attribute with a CSS selector:

```html
<div id="my-embed" style="width: 800px;"></div>

<script
  src="bundle.js"
  data-username="alice"
  data-stream-id="stream-123"
  data-mount="#my-embed"
></script>
```

#### Manual / programmatic mounting

```html
<div id="my-embed" style="width: 100%;"></div>

<script src="bundle.js"></script>
<script>
  CorsaEmbed.mount({
    elementId: 'my-embed',
    username: 'alice',
    streamId: 'stream-123',
    feedMaxHeight: 500,
    components: { map: true, posts: true, elevation: true }
  });
</script>
```

### Responsive layout

The embed uses **CSS container queries** (`@container`) to adapt its internal
layout to the width of its container:

| Container width | Layout |
|---|---|
| < 700 px | Single-column (map stacked above posts) |
| ≥ 700 px | Two-column grid (map + elevation on the left, posts on the right) |

The 700 px breakpoint is defined in `src/embed.css`. If you fork or customise
the CSS, keep the documentation and CSS value in sync.

> **No additional CSS files needed.** PrimeReact (lara-dark-blue theme),
> PrimeIcons, and Tailwind CSS utilities are all bundled into `bundle.js`.

## Map Features

- The route polyline is rendered in red on top of an OpenStreetMap tile layer.
- **Waypoint dot markers** appear on the map at every recorded waypoint along the route.
  - Each dot is a small red circle with a white border.
  - Clicking a dot opens a popup showing the **mile marker** (if available), **altitude** (if available), and the **recorded time** for that waypoint.
  - Markers use `CircleMarker` (SVG-based) so no external icon assets are required; the embed remains fully self-contained.
- **Post markers** appear on the map at each post's GPS location:
  - Blue circle icon for text-only posts.
  - Red circle icon for posts with images.
  - Overlapping posts are spread slightly so they remain individually clickable.
  - Clicking a marker opens a detail popup with the post text and (if present) a thumbnail image.
  - Clicking the thumbnail opens a full-screen lightbox dialog.

## Development

```bash
npm run dev      # start dev server
npm run build    # compile TypeScript + bundle to dist-singlefile/bundle.js
npm run lint     # ESLint
npm run codegen  # regenerate src/generated/schema.ts from AppSync schema
```

---

*This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.*

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).


If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
