import { useEffect, useState } from "react";
import { appsyncRequest } from "../helpers/appsync.helper";
import { EMBED_SETTINGS_QUERY } from "../helpers/queries";
import { useUser } from "../context/useUser";
import { useTheme } from "./ThemeProvider";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { StreamPage } from "./StreamPage";
import type { EmbedSettings } from "../generated/schema";

interface PublicEmbedPageProps {
  publicId: string;
}

interface EmbedByPublicIdResponse {
  getEmbedByPublicId?: {
    embedId: string;
    publicId: string;
    name?: string | null;
    enabled: boolean;
    settings?: EmbedSettings | null;
    livestream?: {
      streamId: string;
      title?: string | null;
      live?: boolean | null;
      publicUser?: {
        username: string;
        profilePicture: string;
      } | null;
    } | null;
  } | null;
}

/** Resolve embed settings into the component visibility object App expects. */
function settingsToComponents(settings?: EmbedSettings | null) {
  const components: {
    map?: boolean;
    posts?: boolean;
    elevation?: boolean;
    route?: boolean;
    profile?: boolean;
    chat?: boolean;
  } = {};

  if (!settings) return components;

  if (settings.showMap === false) components.map = false;
  if (settings.showPosts === false) components.posts = false;
  if (settings.showElevation === false) components.elevation = false;
  if (settings.showProfile === false) components.profile = false;
  if (settings.showChat === false) components.chat = false;
  if (settings.showRoute === false) components.route = false;

  return components;
}

export function PublicEmbedPage({ publicId }: PublicEmbedPageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const { setTheme } = useTheme();
  const [embed, setEmbed] = useState<EmbedByPublicIdResponse["getEmbedByPublicId"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !apiToken) return;

    const token = apiToken;

    async function load() {
      try {
        const data = await appsyncRequest<EmbedByPublicIdResponse>(
          EMBED_SETTINGS_QUERY,
          { publicId },
          token,
        );
        setEmbed(data.getEmbedByPublicId ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load embed settings",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [apiToken, isReady, publicId]);

  // Apply the embed's theme preference once settings are loaded.
  useEffect(() => {
    const theme = embed?.settings?.theme;
    if (theme === "light" || theme === "dark") {
      setTheme(theme);
    }
  }, [embed, setTheme]);

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

  if (!embed) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Embed not found.
      </div>
    );
  }

  if (!embed.enabled) {
    return (
      <div className="p-6 text-gray-300 bg-gray-900 rounded-lg text-center text-sm">
        This embed is currently disabled.
      </div>
    );
  }

  const stream = embed.livestream;
  if (!stream?.streamId || !stream.publicUser?.username) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        This embed has no live stream configured.
      </div>
    );
  }

  const feedMaxHeight =
    embed.settings?.feedMaxHeight != null
      ? embed.settings.feedMaxHeight
      : undefined;

  return (
    <StreamPage
      username={stream.publicUser.username}
      streamId={stream.streamId}
      feedMaxHeight={feedMaxHeight}
      components={settingsToComponents(embed.settings)}
    />
  );
}
