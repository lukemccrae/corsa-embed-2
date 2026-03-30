import { useEffect, useState } from "react";
import { Divider } from "primereact/divider";
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
import { formatTimestamp } from "../utils/time";

interface StreamPageProps {
  username: string;
  streamId: string;
}

interface StreamProfileResponse {
  getUserByUserName: User;
}

export function StreamPage({ username, streamId }: StreamPageProps) {
  console.log(username, streamId, "StreamPage props");
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

  const hasStats =
    stream.mileMarker != null ||
    stream.startTime ||
    stream.finishTime ||
    stream.device?.make;

  return (
    <div className="ce-stream-page">
      <ProfileCard user={user} stream={stream} />

      {/* Stream stats bar */}
      {hasStats && (
        <div className="flex flex-wrap justify-around gap-3 px-5 py-3.5 bg-[#1a1a1a] border-b border-[#2a2a2a]">
          {stream.mileMarker != null && (
            <div className="text-center min-w-[80px]">
              <span className="block text-[11px] text-[#888] uppercase tracking-wide mb-0.5">
                Mile Marker
              </span>
              <span className="block text-lg font-bold text-white">
                {stream.mileMarker.toFixed(1)} mi
              </span>
            </div>
          )}
          {stream.startTime && (
            <div className="text-center min-w-[80px]">
              <span className="block text-[11px] text-[#888] uppercase tracking-wide mb-0.5">
                Started
              </span>
              <span className="block text-lg font-bold text-white">
                {formatTimestamp(stream.startTime)}
              </span>
            </div>
          )}
          {stream.finishTime && (
            <div className="text-center min-w-[80px]">
              <span className="block text-[11px] text-[#888] uppercase tracking-wide mb-0.5">
                Finished
              </span>
              <span className="block text-lg font-bold text-white">
                {formatTimestamp(stream.finishTime)}
              </span>
            </div>
          )}
          {stream.device?.make && (
            <div className="text-center min-w-[80px]">
              <span className="block text-[11px] text-[#888] uppercase tracking-wide mb-0.5">
                Device
              </span>
              <span className="block text-lg font-bold text-white">
                {stream.device.make}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      {waypoints.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-5 pt-4 pb-0 bg-[#1a1a1a]">
            <i className="pi pi-map text-[#e53935]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#aaa]">
              Route Map
            </span>
          </div>
          <Divider className="!mt-2 !mb-0 !mx-5 !border-[#2a2a2a]" />
          <StreamMap
            waypoints={waypoints}
            trackerPosition={trackerPosition}
            posts={posts}
          />
        </>
      )}

      {/* Activity chart */}
      {waypoints.length > 1 && <ActivityChart waypoints={waypoints} />}

      {/* Live chat */}
      {apiToken && (
        <Chat
          streamId={streamId}
          initialMessages={chatMessages}
          apiToken={apiToken}
        />
      )}

      {/* Posts / feed */}
      <Feed posts={posts} />
    </div>
  );
}
