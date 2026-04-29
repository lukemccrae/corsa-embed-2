import { useEffect, useState } from "react";
import { PrimeReactProvider } from "primereact/api";
import { UserProvider } from "./context/UserContext";
import { StreamPage } from "./components/StreamPage";
import ThemeProvider from "./components/ThemeProvider";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { appsyncRequest } from "./helpers/appsync.helper";
import { GET_EMBED_BY_PUBLIC_ID } from "./helpers/queries";
import type { EmbedConfig } from "./types";
import { useUser } from "./context/useUser";
import "./embed.css";

interface AppProps {
  /** Public ID read from data-corsa-public-id on the embed script tag */
  publicId: string;
}

export default function App({ publicId }: AppProps) {
  return (
    <PrimeReactProvider>
      <UserProvider>
        <EmbedLoader publicId={publicId} />
      </UserProvider>
    </PrimeReactProvider>
  );
}

interface GetEmbedResponse {
  getEmbedByPublicId: EmbedConfig | null;
}

function EmbedLoader({ publicId }: { publicId: string }) {
  const { apiToken, isReady, error: authError } = useUser();
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !apiToken) return;

    async function loadEmbedConfig() {
      try {
        const data = await appsyncRequest<GetEmbedResponse>(
          GET_EMBED_BY_PUBLIC_ID(publicId),
          {},
          apiToken!,
        );

        if (!data.getEmbedByPublicId) {
          setError("Embed configuration not found for the given publicId.");
          return;
        }

        setEmbedConfig(data.getEmbedByPublicId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load embed configuration.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEmbedConfig();
  }, [apiToken, isReady, publicId]);

  if (authError) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Auth error: {authError}
      </div>
    );
  }

  if (!isReady || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Error: {error}
      </div>
    );
  }

  if (!embedConfig) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Embed not found.
      </div>
    );
  }

  const { settings, livestreamId, livestream } = embedConfig;
  const username = livestream?.publicUser?.username;

  if (!username || !livestreamId) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Missing livestream configuration.
      </div>
    );
  }

  return (
    <ThemeProvider initialTheme={settings.theme}>
      <div className="w-full">
        <StreamPage
          username={username}
          streamId={livestreamId}
          embedSettings={settings}
        />
      </div>
    </ThemeProvider>
  );
}
