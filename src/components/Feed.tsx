import type { Post, StatusPost } from "../generated/schema";
import { resolveImageUrl } from "../utils/userImages";
import { formatTimestamp } from "../utils/time";

interface FeedProps {
  posts: Post[];
}

function isStatusPost(post: Post): post is StatusPost {
  return (post as StatusPost).__typename === "StatusPost";
}

export function Feed({ posts }: FeedProps) {
  const statusPosts = posts.filter(isStatusPost);

  if (statusPosts.length === 0) {
    return null;
  }

  return (
    <div className="ce-feed">
      <h3 className="ce-section-title">Posts</h3>
      {statusPosts.map((post, i) => {
        const imageUrl = post.imagePath ? resolveImageUrl(post.imagePath) : null;
        return (
          <div
            key={`${post.createdAt}-${post.userId}-${i}`}
            className="ce-post"
          >
            <div className="ce-post-header">
              <span className="ce-chat-time">
                {formatTimestamp(post.createdAt)}
              </span>
            </div>
            {post.text && <p className="ce-post-content">{post.text}</p>}
            {imageUrl && (
              <img src={imageUrl} alt="Post" className="ce-post-image" />
            )}
          </div>
        );
      })}
    </div>
  );
}
