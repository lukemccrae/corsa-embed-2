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
import {
  STREAM_PROFILE_QUERY,
  STREAM_CHAT_PAGE_QUERY,
  ON_NEW_WAYPOINT,
  ON_NEW_CHAT,
} from "../helpers/queries";
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
  /** Maximum height (px) of the chat scroll area. Default: 420 */
  chatMaxHeight?: number;
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

/** ChatMessages page response shape returned by STREAM_CHAT_PAGE_QUERY */
interface ChatPageResponse {
  getUserByUserName: {
    liveStreams: Array<{
      chatMessages: ChatMessagesConnection;
    }>;
  };
}

/** Returns a stable dedup key for a chat message. */
function chatMessageKey(m: ChatMessage): string {
  return `${m.createdAt}:${m.userId}`;
}

export function StreamPage({
  username,
  streamId,
  feedMaxHeight = 600,
  chatMaxHeight = 420,
  components = {},
}: StreamPageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [user, setUser] = useState<User | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatNextToken, setChatNextToken] = useState<string | null>(null);
  const [chatLoadingMore, setChatLoadingMore] = useState(false);
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
        setChatNextToken(chatConn?.nextToken ?? null);
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

  // Subscribe to live chat updates
  useEffect(() => {
    if (!apiToken || !stream?.live) return;
    const unsub = appsyncSubscribe<{ onNewChat: ChatMessage }>(
      ON_NEW_CHAT,
      { streamId },
      apiToken,
      (data) => {
        if (data.onNewChat) {
          setChatMessages((prev) => {
            const key = chatMessageKey(data.onNewChat);
            if (prev.some((m) => chatMessageKey(m) === key)) {
              return prev;
            }
            return [...prev, data.onNewChat];
          });
        }
      },
    );
    return unsub;
  }, [apiToken, stream, streamId]);

  async function loadMoreChat() {
    if (!apiToken || chatLoadingMore || !chatNextToken) return;
    setChatLoadingMore(true);
    try {
      const data = await appsyncRequest<ChatPageResponse>(
        STREAM_CHAT_PAGE_QUERY(username, streamId, chatNextToken),
        {},
        apiToken,
      );
      const nextConn = data?.getUserByUserName?.liveStreams?.[0]?.chatMessages;
      const nextItems: ChatMessage[] =
        nextConn?.items?.filter((m): m is ChatMessage => m != null) ?? [];
      setChatMessages((prev) => {
        const seen = new Set(prev.map(chatMessageKey));
        const older: ChatMessage[] = [];
        for (const m of nextItems) {
          if (!seen.has(chatMessageKey(m))) older.push(m);
        }
        // Prepend older messages so newest remain at the bottom
        return [...older, ...prev];
      });
      setChatNextToken(nextConn?.nextToken ?? null);
    } finally {
      setChatLoadingMore(false);
    }
  }

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

  // Filter out private waypoints and waypoints within the broadcast delay window
  const delayMs = (stream.delayInSeconds ?? 0) * 1000;
  const cutoffTime = Date.now() - delayMs;
  const publicWaypoints = waypoints.filter((w) => {
    if (w.private) return false;
    if (delayMs > 0) {
      const ts = new Date(w.timestamp).getTime();
      if (isNaN(ts)) return false;
      if (ts > cutoffTime) return false;
    }
    return true;
  });

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

  // Notification if all waypoints are hidden
  const allWaypointsHidden = waypoints.length > 0 && publicWaypoints.length === 0;

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

      {/* Notification if all waypoints are hidden */}
      {allWaypointsHidden && (
        <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded text-center text-sm border border-yellow-300">
          All location points for this stream are currently hidden by the user.
        </div>
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
            isLive={isLive}
            chatMaxHeight={chatMaxHeight}
            onLoadMore={loadMoreChat}
            hasMore={chatNextToken != null}
            loadingMore={chatLoadingMore}
          />
        </div>
      )}
    </div>
  );
}
