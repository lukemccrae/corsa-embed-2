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
import { ProfileCard } from "./ProfileCard";
import { StreamMap } from "./StreamMap";
import { ActivityChart } from "./ActivityChart";
import { Chat } from "./Chat";
import { Feed } from "./Feed";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface StreamPageProps {
  username: string;
  streamId: string;
}

interface StreamProfileResponse {
  getUserByUserName: User;
}

export function StreamPage({ username, streamId }: StreamPageProps) {
  console.log(username, streamId, "StreamPage propssss");
  const { apiToken, isReady, error: authError } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile + stream data in one query once we have a token
  useEffect(() => {
    if (!isReady || !apiToken) return;

    const token = apiToken;

    async function load() {
      try {
        const data = await appsyncRequest<StreamProfileResponse>(
          STREAM_PROFILE_QUERY(username, streamId),
          {},
          token
        );

        const userData = data.getUserByUserName;
        setUser(userData);

        const liveStream = userData.liveStreams?.[0] ?? null;
        setStream(liveStream);
        setWaypoints(
          liveStream?.waypoints?.filter((w): w is Waypoint => w != null) ?? []
        );
        setChatMessages(
          liveStream?.chatMessages?.filter(
            (m): m is ChatMessage => m != null
          ) ?? []
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stream data"
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
      }
    );
    return unsub;
  }, [apiToken, stream, streamId]);

  if (authError) {
    return (
      <div className="p-6 text-[#ef9a9a] bg-[#1a1a1a] rounded-lg text-center text-sm">
        Auth error: {authError}
      </div>
    );
  }

  if (!isReady || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    console.log("error loading stream data", error);
    return (
      <div className="p-6 text-[#ef9a9a] bg-[#1a1a1a] rounded-lg text-center text-sm">
        Error: {error}
      </div>
    );
  }

  if (!user || !stream) {
    return (
      <div className="p-6 text-[#ef9a9a] bg-[#1a1a1a] rounded-lg text-center text-sm">
        Stream not found.
      </div>
    );
  }

  const trackerPosition =
    waypoints.length > 0 ? waypoints[waypoints.length - 1] : undefined;

  const posts: Post[] =
    stream.posts?.filter((p): p is Post => p != null) ?? [];

  return (
    <div className="ce-stream-page">
      {/* Profile header card */}
      <ProfileCard user={user} stream={stream} />

      {/* Map card */}
      {waypoints.length > 0 && (
        <div className="ce-section-card ce-map-panel">
          <div className="ce-section-header">
            <i className="pi pi-map ce-section-icon" />
            <span className="ce-section-title">Route Map</span>
          </div>
          <StreamMap
            waypoints={waypoints}
            trackerPosition={trackerPosition}
            posts={posts}
          />
        </div>
      )}

      {/* Activity chart card */}
      {waypoints.length > 1 && (
        <div className="ce-section-card">
          <ActivityChart waypoints={waypoints} />
        </div>
      )}

      {/* Live chat card */}
      {apiToken && (
        <div className="ce-section-card">
          <Chat
            streamId={streamId}
            initialMessages={chatMessages}
            apiToken={apiToken}
          />
        </div>
      )}

      {/* Posts / feed card */}
      <Feed posts={posts} />
    </div>
  );
}
