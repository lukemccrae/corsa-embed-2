import type { User, LiveStream } from "../generated/schema";
import { resolveImageUrl, initialsAvatar } from "../utils/userImages";
import { formatTimestamp } from "../utils/time";

interface ProfileCardProps {
  user: User;
  stream?: Pick<
    LiveStream,
    "title" | "live" | "startTime" | "finishTime" | "mileMarker" | "device" | "route"
  >;
}

export function ProfileCard({ user, stream }: ProfileCardProps) {
  const avatarUrl = resolveImageUrl(user.profilePicture);
  const isLive = stream?.live === true || user.live === true;

  const stats: { label: string; value: string }[] = [];
  if (stream?.mileMarker != null)
    stats.push({ label: "Mile Marker", value: `${stream.mileMarker.toFixed(1)} mi` });
  if (stream?.startTime)
    stats.push({ label: "Started", value: formatTimestamp(stream.startTime) });
  if (stream?.finishTime)
    stats.push({ label: "Finished", value: formatTimestamp(stream.finishTime) });
  if (stream?.device?.make)
    stats.push({ label: "Device", value: stream.device.make });
  if (stream?.route?.name)
    stats.push({ label: "Route", value: stream.route.name });

  return (
    <div className="ce-profile-card">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-[72px] h-[72px] rounded-full object-cover border-2 border-[#e53935]"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#333] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#e53935]">
              {initialsAvatar(user.username)}
            </div>
          )}
          {isLive && <span className="ce-live-badge">LIVE</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="m-0 text-lg font-bold text-white leading-tight">
            {user.username}
          </h2>
          {user.bio && (
            <p className="mt-1 text-sm text-[#bbb]">{user.bio}</p>
          )}
          {stream?.title && (
            <p className="mt-1 text-sm font-semibold text-[#e53935]">
              {stream.title}
            </p>
          )}
        </div>
      </div>

      {/* Compact stats row */}
      {stats.length > 0 && (
        <div className="ce-profile-stats-row">
          {stats.map(({ label, value }) => (
            <div key={label} className="ce-stat-item">
              <span className="ce-stat-label">{label}</span>
              <span className="ce-stat-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
