# Corsa Embed 2

A React + TypeScript + Vite embed library that renders a live activity stream (map, chat, posts, profile) for the Corsa platform.

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

```html
<script>
  window.__CORSA_EMBED_CONFIG__ = {
    firebase: { apiKey: "...", authDomain: "...", ... },
    domain: { appsyncEndpoint: "...", appsyncRealtimeEndpoint: "...", cdnBase: "..." }
  };
</script>
<script src="bundle.js"></script>
<script>CorsaEmbed.mount(document.getElementById("embed"), { username: "alice", streamId: "stream-123" });</script>
```

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
