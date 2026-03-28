import type { User, LiveStream } from "../generated/schema";
import { resolveImageUrl, initialsAvatar } from "../utils/userImages";

interface ProfileCardProps {
  user: User;
  stream?: Pick<LiveStream, "title" | "live">;
}

export function ProfileCard({ user, stream }: ProfileCardProps) {
  const avatarUrl = resolveImageUrl(user.profilePicture);
  const isLive = stream?.live === true || user.live === true;

  return (
    <div className="ce-profile-card">
      <div className="ce-profile-avatar-wrapper">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.username}
            className="ce-profile-avatar"
          />
        ) : (
          <div className="ce-profile-avatar ce-profile-avatar--placeholder">
            {initialsAvatar(user.username)}
          </div>
        )}
        {isLive && <span className="ce-live-badge">LIVE</span>}
      </div>

      <div className="ce-profile-info">
        <h2 className="ce-profile-name">{user.username}</h2>
        {user.bio && <p className="ce-profile-bio">{user.bio}</p>}
        {stream?.title && (
          <p className="ce-stream-title">{stream.title}</p>
        )}
      </div>
    </div>
  );
}
