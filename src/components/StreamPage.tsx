import { useEffect, useState } from "react";
import type {
  User,
  LiveStream,
  ChatMessage,
  Waypoint,
  Post,
} from "../generated/schema";
import { appsyncRequest } from "../helpers/appsync.helper";
import { appsyncSubscribe } from "../helpers/appsync-subscription.helper";
import { STREAM_PROFILE_QUERY, ON_NEW_WAYPOINT } from "../helpers/queries";
import { useUser } from "../context/useUser";
import { LoadingSkeleton } from "./LoadingSkeleton";
import LiveProfileCard from "./ProfileCard";
import { CoverMap } from "./CoverMap";
import { ProfileLiveChat } from "./ProfileLiveChat";
import { FeedItem } from "./FeedItem";
import { ElevationProfile } from "./ElevationProfile";
import { getProfilePictureUrl } from "../utils/userImages";
import { useTheme } from "./ThemeProvider";

interface StreamPageProps {
  username: string;
  streamId: string;
}

interface StreamProfileResponse {
  getUserByUserName: User;
}

export function StreamPage({ username, streamId }: StreamPageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [user, setUser] = useState<User | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = isDark
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";

  // Fetch user profile + stream data once we have a token
  useEffect(() => {
    if (!isReady || !apiToken) return;

    const token = apiToken;

    async function load() {
      try {
        const data = await appsyncRequest<StreamProfileResponse>(
          STREAM_PROFILE_QUERY(username, streamId),
          {},
          token,
        );

        const userData = data.getUserByUserName;
        setUser(userData);

        const liveStream = userData.liveStreams?.[0] ?? null;
        setStream(liveStream);
        setWaypoints(
          liveStream?.waypoints?.filter((w): w is Waypoint => w != null) ?? [],
        );
        setChatMessages(
          liveStream?.chatMessages?.filter(
            (m): m is ChatMessage => m != null,
          ) ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stream data",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [apiToken, isReady, username, streamId]);

  // Subscribe to live waypoint updates
  useEffect(() => {
    if (!apiToken || !stream?.live) return;
    const unsub = appsyncSubscribe<{ onNewWaypoint: Waypoint }>(
      ON_NEW_WAYPOINT,
      { streamId },
      apiToken,
      (data) => {
        if (data.onNewWaypoint) {
          setWaypoints((prev) => [...prev, data.onNewWaypoint]);
        }
      },
    );
    return unsub;
  }, [apiToken, stream, streamId]);

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

  if (!user || !stream) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Stream not found.
      </div>
    );
  }

  if (
    !user.liveStreams ||
    user.liveStreams.length === 0 ||
    !user.liveStreams[0]
  ) {
    return null;
  }

  const startTime = new Date(user.liveStreams[0].startTime);
  const finishTime = user.liveStreams[0].finishTime ?? null;
  const isLive = !!(user.liveStreams[0].live && !finishTime);

  // Filter out private waypoints for the map
  const publicWaypoints = waypoints.filter((w) => !w.private);

  const posts: Post[] =
    stream.posts?.filter((p): p is Post => p != null) ?? [];

  const hasMap = publicWaypoints.length > 0;

  // Only show elevation section when waypoints have altitude readings
  const waypointsWithAlt = publicWaypoints.filter((w) => w.altitude != null);

  return (
    <div className="ce-stream-page">
      {/* Profile header card */}
      <LiveProfileCard
        username={user.username}
        profilePicture={getProfilePictureUrl({
          profilePicture: user.profilePicture,
        })}
        streamTitle={user.liveStreams?.[0]?.title}
        startTime={startTime}
        finishTime={finishTime}
        timezone={stream.timezone}
        isLive={isLive}
        routeId={stream.route?.routeId ?? null}
        routeName={stream.route?.name ?? null}
      />

      {/* Map + Chat side-by-side on md+ screens */}
      {(hasMap || chatMessages.length > 0) && (
        <div className="flex flex-col gap-3">
          {/* Map */}
          {hasMap && (
            <div
              className={`${cardBg} border rounded-lg shadow-lg overflow-hidden flex-1 min-w-0`}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
                <i className="pi pi-map-marker text-red-500 text-sm" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Route Map
                </span>
              </div>
              <CoverMap
                waypoints={publicWaypoints}
                isLive={isLive}
                height={320}
                posts={posts}
              />
            </div>
          )}

          {/* Chat */}
          <div
            className={`${cardBg} border rounded-lg shadow-lg overflow-hidden ${
              hasMap ? "md:w-72 lg:w-80" : "w-full"
            } flex flex-col`}
            style={{ minHeight: 320, maxHeight: 400 }}
          >
            <ProfileLiveChat
              initialMessages={chatMessages}
              streamId={streamId}
              apiToken={apiToken}
              isLive={isLive}
            />
          </div>
        </div>
      )}

      {/* Elevation Profile */}
      {waypointsWithAlt.length >= 2 && (
        <div
          className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
            <i className="pi pi-chart-line text-red-500 text-sm" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Elevation Profile
            </span>
          </div>
          <ElevationProfile waypoints={publicWaypoints} />
        </div>
      )}

      {/* Feed / Posts */}
      {posts.length > 0 && (
        <div
          className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
            <i className="pi pi-list text-red-500 text-sm" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Updates
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {posts.map((post, i) => (
              <FeedItem key={`${post.createdAt}-${i}`} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
