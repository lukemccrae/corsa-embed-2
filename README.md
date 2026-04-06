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

### Firebase configuration

The embed needs a Firebase project to perform anonymous authentication. Config
is resolved in this priority order:

1. **Runtime config** – set `window.__CORSA_EMBED_CONFIG__.firebase` _before_
   loading `bundle.js`. Useful when you host the bundle yourself and want to
   supply credentials at page load time without a rebuild.
2. **Build-time env vars** – create a `.env` file (copy from `.env.example`)
   and set `VITE_FIREBASE_*` before running `npm run build`. Vite replaces
   references at bundle time.
3. **Bundled defaults** – the bundle ships with default credentials for the
   `corsa-auth` Firebase project. If you are embedding from a different project
   you must provide one of the options above.

If the resolved `apiKey` is empty or invalid the bundle throws a descriptive
error in the browser console instead of the cryptic Firebase `auth/invalid-api-key`.

```html
<!-- Option 1: runtime config (no rebuild needed) -->
<script>
  window.__CORSA_EMBED_CONFIG__ = {
    firebase: {
      apiKey: "AIzaSy...",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abc123def456"
    },
    domain: {
      appsyncEndpoint: "https://....appsync-api.us-east-1.amazonaws.com/graphql",
      appsyncRealtimeEndpoint: "wss://....appsync-realtime-api.us-east-1.amazonaws.com/graphql",
      cdnBase: "https://your-cdn.cloudfront.net"
    }
  };
</script>
<script src="bundle.js"></script>
<script>CorsaEmbed.mount(document.getElementById("embed"), { username: "alice", streamId: "stream-123" });</script>
```

#### `.env` (build-time, option 2)

```dotenv
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

> **No additional CSS files needed.** PrimeReact (lara-dark-blue theme), PrimeIcons, and Tailwind
> CSS utilities are all bundled into `bundle.js` by `vite-plugin-css-injected-by-js`.

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
