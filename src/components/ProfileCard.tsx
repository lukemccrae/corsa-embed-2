import type { UserProfile } from "../types";
import { resolveImageUrl, initialsAvatar } from "../utils/userImages";
import { formatDistance } from "../utils/time";

interface ProfileCardProps {
  profile: UserProfile;
  stream?: { status?: string; title?: string };
}

export function ProfileCard({ profile, stream }: ProfileCardProps) {
  const avatarUrl = resolveImageUrl(profile.avatarKey);
  const isLive = stream?.status === "LIVE";

  return (
    <div className="ce-profile-card">
      <div className="ce-profile-avatar-wrapper">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.displayName}
            className="ce-profile-avatar"
          />
        ) : (
          <div className="ce-profile-avatar ce-profile-avatar--placeholder">
            {initialsAvatar(profile.displayName)}
          </div>
        )}
        {isLive && <span className="ce-live-badge">LIVE</span>}
      </div>

      <div className="ce-profile-info">
        <h2 className="ce-profile-name">{profile.displayName}</h2>
        <p className="ce-profile-username">@{profile.username}</p>
        {profile.bio && (
          <p className="ce-profile-bio">{profile.bio}</p>
        )}
        {stream?.title && (
          <p className="ce-stream-title">{stream.title}</p>
        )}
      </div>

      <div className="ce-profile-stats">
        {profile.totalActivities !== undefined && (
          <div className="ce-stat">
            <span className="ce-stat-value">{profile.totalActivities}</span>
            <span className="ce-stat-label">Activities</span>
          </div>
        )}
        {profile.totalDistance !== undefined && (
          <div className="ce-stat">
            <span className="ce-stat-value">
              {formatDistance(profile.totalDistance)}
            </span>
            <span className="ce-stat-label">Total</span>
          </div>
        )}
        {profile.followerCount !== undefined && (
          <div className="ce-stat">
            <span className="ce-stat-value">{profile.followerCount}</span>
            <span className="ce-stat-label">Followers</span>
          </div>
        )}
      </div>
    </div>
  );
}
