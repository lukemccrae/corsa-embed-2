import { useEffect, useState } from "react";
import type {
  User,
  LiveStream,
  Waypoint,
  Post,
  ChatMessage,
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
  /** Maximum height (px) of the feed/posts scroll area. Default: 600 */
  feedMaxHeight?: number;
  /** Component visibility settings */
  components?: {
    map?: boolean;
    posts?: boolean;
    elevation?: boolean;
    route?: boolean;
    profile?: boolean;
    chat?: boolean;
  };
}

/** AppSync returns chatMessages as a connection with items + nextToken */
interface ChatMessagesConnection {
  items: ChatMessage[];
  nextToken?: string | null;
}

interface StreamProfileResponse {
  getUserByUserName: User;
}

export function StreamPage({ username, streamId, feedMaxHeight = 600, components = {} }: StreamPageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [user, setUser] = useState<User | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default all components to visible if not explicitly set
  const showMap = components.map !== false;
  const showPosts = components.posts !== false;
  const showElevation = components.elevation !== false;
  const showProfile = components.profile !== false;
  const showChat = components.chat !== false;

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
        // The API returns chatMessages as a connection ({ items, nextToken }),
        // which differs from the generated schema type (plain array).
        const chatConn = (liveStream as unknown as { chatMessages?: ChatMessagesConnection })
          ?.chatMessages;
        setChatMessages(
          chatConn?.items?.filter((m): m is ChatMessage => m != null) ?? [],
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
    stream.posts?.filter((p): p is Post => p != null).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) ?? [];

  const hasPostsWithLocation = posts.some(
    (p) => p.location?.lat != null && p.location?.lng != null,
  );
  const hasMap = publicWaypoints.length > 0 || hasPostsWithLocation;

  // Debug logging
  console.log('[StreamPage] Debug:', {
    postsCount: posts.length,
    postsWithLocation: posts.filter((p) => p.location?.lat != null && p.location?.lng != null).length,
    hasPostsWithLocation,
    publicWaypointsCount: publicWaypoints.length,
    hasMap,
  });

  // Only show elevation section when waypoints have altitude readings
  const waypointsWithAlt = publicWaypoints.filter((w) => w.altitude != null);

  return (
    <div className="ce-stream-page">
      {/* Profile header card – always full width */}
      {showProfile && (
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
      )}

      {/* Responsive grid: single column on narrow, two columns on wide containers */}
      <div className="ce-stream-grid">
        {/* Left / top column: Map + Elevation */}
        {(hasMap || waypointsWithAlt.length >= 2) && (
          <div className="ce-stream-col-main flex flex-col gap-3">
            {/* Map */}
            {hasMap && showMap && (
              <div
                className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}
              >
                <CoverMap
                  waypoints={publicWaypoints}
                  isLive={isLive}
                  wrapperClassName="ce-map-responsive"
                  posts={posts}
                />
              </div>
            )}

            {/* Elevation Profile */}
            {waypointsWithAlt.length >= 2 && showElevation && (
              <div
                className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}
              >
                <ElevationProfile waypoints={publicWaypoints} />
              </div>
            )}
          </div>
        )}

        {/* Right / bottom column: Posts */}
        {posts.length > 0 && showPosts && (
          <div className="ce-stream-col-side">
            <div
              className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}
            >
              <div
                className="ce-feed-scroll flex flex-col gap-3 p-4"
                style={{ maxHeight: feedMaxHeight, overflowY: "auto", overscrollBehavior: "contain" }}
              >
                {posts.map((post, i) => (
                  <FeedItem key={`${post.createdAt}-${i}`} post={post} user={user} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      {showChat && (
        <div className={`ce-section-card ${cardBg} border rounded-lg shadow-lg overflow-hidden`}>
          <ProfileLiveChat
            initialMessages={chatMessages}
            streamId={streamId}
            apiToken={apiToken}
            isLive={isLive}
          />
        </div>
      )}
    </div>
  );
}
