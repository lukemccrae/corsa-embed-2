import { Tag } from "primereact/tag";
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
    <div className="ce-profile-card flex items-start gap-4 p-5 bg-[#1e1e1e] border-b border-[#2a2a2a]">
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
        {isLive && (
          <Tag
            value="LIVE"
            severity="danger"
            className="!absolute !-bottom-2 !left-1/2 !-translate-x-1/2 !text-[9px] !font-bold !px-1.5 !py-0.5 !rounded"
          />
        )}
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
  );
}
