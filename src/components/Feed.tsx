import type { Post } from "../types";
import { resolveImageUrl, initialsAvatar } from "../utils/userImages";
import { formatTimestamp } from "../utils/time";

interface FeedProps {
  posts: Post[];
}

export function Feed({ posts }: FeedProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="ce-feed">
      <h3 className="ce-section-title">Posts</h3>
      {posts.map((post) => {
        const avatarUrl = resolveImageUrl(post.authorAvatarKey);
        const imageUrl = resolveImageUrl(post.imageKey);
        return (
          <div key={post.id} className="ce-post">
            <div className="ce-post-header">
              <div className="ce-chat-avatar">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={post.authorDisplayName}
                    className="ce-chat-avatar-img"
                  />
                ) : (
                  <div className="ce-chat-avatar-placeholder">
                    {initialsAvatar(post.authorDisplayName)}
                  </div>
                )}
              </div>
              <div>
                <span className="ce-chat-author">{post.authorDisplayName}</span>
                <span className="ce-chat-time">
                  {formatTimestamp(post.createdAt)}
                </span>
              </div>
            </div>
            <p className="ce-post-content">{post.content}</p>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Post"
                className="ce-post-image"
              />
            )}
            {post.likeCount !== undefined && (
              <div className="ce-post-likes">❤️ {post.likeCount}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
