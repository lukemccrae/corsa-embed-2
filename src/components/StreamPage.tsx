import { useEffect, useState } from "react";
import type { UserProfile, Stream, ChatMessage, Coordinate } from "../types";
import { appsyncRequest } from "../helpers/appsync.helper";
import { appsyncSubscribe } from "../helpers/appsync-subscription.helper";
import {
  GET_PROFILE_BY_USERNAME,
  GET_STREAM,
  GET_STREAM_CHAT,
  ON_STREAM_COORDINATE_ADDED,
  ON_STREAM_UPDATED,
} from "../helpers/queries";
import { useUser } from "../context/useUser";
import { ProfileCard } from "./ProfileCard";
import { StreamMap } from "./StreamMap";
import { ActivityChart } from "./ActivityChart";
import { Chat } from "./Chat";
import { Feed } from "./Feed";
import { LoadingSkeleton } from "./LoadingSkeleton";
import {
  formatDistance,
  formatDuration,
  formatPace,
} from "../utils/time";

interface StreamPageProps {
  username: string;
  streamId: string;
}

interface GetProfileResponse {
  getProfileByUsername: UserProfile;
}

interface GetStreamResponse {
  getStream: Stream;
}

interface GetChatResponse {
  getStreamChat: { items: ChatMessage[]; nextToken?: string };
}

interface StreamUpdatedPayload {
  onStreamUpdated: Partial<Stream>;
}

interface CoordAddedPayload {
  onStreamCoordinateAdded: Coordinate;
}

export function StreamPage({ username, streamId }: StreamPageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data once we have a token
  useEffect(() => {
    if (!isReady || !apiToken) return;

    const token = apiToken;

    async function load() {
      try {
        const [profileData, streamData, chatData] = await Promise.all([
          appsyncRequest<GetProfileResponse>(
            GET_PROFILE_BY_USERNAME,
            { username },
            token
          ),
          appsyncRequest<GetStreamResponse>(
            GET_STREAM,
            { streamId },
            token
          ),
          appsyncRequest<GetChatResponse>(
            GET_STREAM_CHAT,
            { streamId },
            token
          ),
        ]);

        setProfile(profileData.getProfileByUsername);
        const s = streamData.getStream;
        setStream(s);
        setCoordinates(s.coordinates ?? []);
        setChatMessages(chatData.getStreamChat.items);
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

  // Subscribe to live coordinate updates
  useEffect(() => {
    if (!apiToken || !stream || stream.status !== "LIVE") return;
    const unsub = appsyncSubscribe<CoordAddedPayload>(
      ON_STREAM_COORDINATE_ADDED,
      { streamId },
      apiToken,
      (data) => {
        if (data.onStreamCoordinateAdded) {
          setCoordinates((prev) => [...prev, data.onStreamCoordinateAdded]);
        }
      }
    );
    return unsub;
  }, [apiToken, stream, streamId]);

  // Subscribe to stream status/stats updates
  useEffect(() => {
    if (!apiToken || !stream) return;
    const unsub = appsyncSubscribe<StreamUpdatedPayload>(
      ON_STREAM_UPDATED,
      { streamId },
      apiToken,
      (data) => {
        if (data.onStreamUpdated) {
          setStream((prev) =>
            prev ? { ...prev, ...data.onStreamUpdated } : prev
          );
        }
      }
    );
    return unsub;
  }, [apiToken, stream, streamId]);

  if (authError) {
    return (
      <div className="ce-error">
        Auth error: {authError}
      </div>
    );
  }

  if (!isReady || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div className="ce-error">Error: {error}</div>;
  }

  if (!profile || !stream) {
    return <div className="ce-error">Stream not found.</div>;
  }

  const trackerPosition =
    coordinates.length > 0 ? coordinates[coordinates.length - 1] : undefined;

  const posts = stream.posts?.items ?? [];

  return (
    <div className="ce-stream-page">
      <ProfileCard profile={profile} stream={stream} />

      {/* Stream stats bar */}
      <div className="ce-stats-bar">
        <div className="ce-stat-item">
          <span className="ce-stat-label">Distance</span>
          <span className="ce-stat-value">{formatDistance(stream.distance)}</span>
        </div>
        <div className="ce-stat-item">
          <span className="ce-stat-label">Duration</span>
          <span className="ce-stat-value">{formatDuration(stream.duration)}</span>
        </div>
        <div className="ce-stat-item">
          <span className="ce-stat-label">Elevation</span>
          <span className="ce-stat-value">
            {stream.elevationGain !== undefined
              ? `${Math.round(stream.elevationGain)} m`
              : "--"}
          </span>
        </div>
        {stream.duration && stream.distance && stream.distance > 0 && (
          <div className="ce-stat-item">
            <span className="ce-stat-label">Avg Pace</span>
            <span className="ce-stat-value">
              {formatPace(stream.duration / (stream.distance / 1000))}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      {coordinates.length > 0 && (
        <StreamMap
          coordinates={coordinates}
          trackerPosition={trackerPosition}
        />
      )}

      {/* Activity chart */}
      {coordinates.length > 1 && (
        <ActivityChart coordinates={coordinates} />
      )}

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
