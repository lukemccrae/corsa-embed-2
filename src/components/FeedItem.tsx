import type { Post, StatusPost } from "../generated/schema";
import { getPostImageUrl } from "../utils/userImages";
import { useTheme } from "./ThemeProvider";

interface FeedItemProps {
  post: Post;
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

export function FeedItem({ post }: FeedItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cardBg = isDark
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";
  const mutedColor = isDark ? "text-gray-400" : "text-gray-500";
  const bodyColor = isDark ? "text-gray-300" : "text-gray-700";

  const statusPost = post as StatusPost;
  const hasImage = !!statusPost.imagePath;
  const hasText = !!statusPost.text;

  const postTypeIcon: Record<string, string> = {
    STATUS: "pi-comment",
    PHOTO: "pi-image",
    BLOG: "pi-file",
    LIVESTREAM: "pi-video",
  };
  const icon = postTypeIcon[post.type] ?? "pi-comment";

  return (
    <div className={`${cardBg} border rounded-lg p-4 shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <i className={`pi ${icon} text-sm text-red-400`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${mutedColor}`}>
              {post.type === "STATUS"
                ? "Update"
                : post.type === "PHOTO"
                ? "Photo"
                : post.type === "BLOG"
                ? "Note"
                : "Post"}
            </span>
            <span className={`text-xs ${mutedColor}`}>
              {formatPostTime(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Body text */}
      {hasText && (
        <p className={`text-sm ${bodyColor} leading-relaxed mb-3`}>
          {statusPost.text}
        </p>
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
