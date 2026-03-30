import { useState } from "react";
import { Dialog } from "primereact/dialog";
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (statusPosts.length === 0) {
    return null;
  }

  return (
    <div className="ce-feed ce-section-card">
      <div className="ce-section-header">
        <i className="pi pi-images ce-section-icon" />
        <span className="ce-section-title">Posts</span>
      </div>

      <div className="ce-feed-list">
        {statusPosts.map((post, i) => {
          const imageUrl = post.imagePath
            ? resolveImageUrl(post.imagePath)
            : null;
          return (
            <div
              key={`${post.createdAt}-${post.userId}-${i}`}
              className="rounded-lg bg-[#242424] overflow-hidden border border-[#2a2a2a]"
            >
              <div className="px-4 py-3">
                <span className="text-[11px] text-[#666]">
                  {formatTimestamp(post.createdAt)}
                </span>
                {post.text && (
                  <p className="mt-1 text-sm text-[#ccc] break-words">
                    {post.text}
                  </p>
                )}
              </div>
              {imageUrl && (
                <button
                  type="button"
                  className="w-full cursor-pointer border-0 p-0 bg-transparent"
                  onClick={() => setLightboxUrl(imageUrl)}
                  aria-label="View full image"
                >
                  <img
                    src={imageUrl}
                    alt="Post"
                    className="w-full object-cover max-h-72 hover:opacity-90 transition-opacity"
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox dialog */}
      <Dialog
        visible={lightboxUrl !== null}
        onHide={() => setLightboxUrl(null)}
        header="Post Image"
        maximizable
        className="!w-auto !max-w-[90vw]"
        contentClassName="!p-0 !bg-[#121212]"
        headerClassName="!bg-[#1e1e1e] !text-white !border-b !border-[#2a2a2a]"
      >
        {lightboxUrl && (
          <img
            src={lightboxUrl}
            alt="Full size post"
            className="max-w-full max-h-[80vh] block"
          />
        )}
      </Dialog>
    </div>
  );
}
