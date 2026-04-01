import { useState } from "react";
import type { Post, StatusPost } from "../generated/schema";
import { getPostImageUrl, getProfilePictureUrl } from "../utils/userImages";
import { useTheme } from "./ThemeProvider";

interface FeedItemProps {
  post: Post;
  user: User;
}

function formatPostTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function FeedItem({ post, user }: FeedItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);

  const cardBg = isDark
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";
  const mutedColor = isDark ? "text-gray-400" : "text-gray-500";
  const bodyColor = isDark ? "text-gray-300" : "text-gray-700";

  const statusPost = post as StatusPost;
  const hasImage = !!statusPost.imagePath;
  const hasText = !!statusPost.text;
  const textLength = statusPost.text?.length ?? 0;
  const isLongText = textLength > 200;

  const postTypeIcon: Record<string, string> = {
    STATUS: "pi-comment",
    PHOTO: "pi-image",
    BLOG: "pi-file",
    LIVESTREAM: "pi-video",
  };
  const icon = postTypeIcon[post.type] ?? "pi-comment";

  return (
    <div className={`${cardBg} border rounded-lg p-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          {/* <i className={`pi ${icon} text-sm text-red-400`} /> */}
          {/* user profile picture icon */}
          <img
            src={getProfilePictureUrl({ profilePicture: user.profilePicture })}
            alt={`${user.username}'s profile`}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* <span className={`text-xs font-semibold uppercase tracking-wide ${mutedColor}`}>
              {post.type === "STATUS"
                ? "Update"
                : post.type === "PHOTO"
                ? "Photo"
                : post.type === "BLOG"
                ? "Note"
                : "Post"}
            </span> */}
            <span className={`text-xs ${mutedColor}`}>
              {formatPostTime(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Body text */}
      {hasText && (
        <div className="mb-3">
          <p className={`text-sm ${bodyColor} leading-relaxed ${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}>
            {statusPost.text}
          </p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs ${mutedColor} hover:text-red-400 mt-1 font-medium transition-colors`}
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Image */}
      {hasImage && statusPost.imagePath && (
        <div className="overflow-hidden rounded-lg mt-1 mb-2 bg-black/10">
          <img
            src={getPostImageUrl(statusPost.imagePath)}
            alt="Post image"
            className="w-full block object-contain max-h-96 rounded-lg"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Location tag */}
      {post.location && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${mutedColor}`}>
          <i className="pi pi-map-marker text-xs" />
          <span>
            {post.location.lat.toFixed(4)}, {post.location.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
