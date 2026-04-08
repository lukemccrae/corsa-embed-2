import { useEffect, useRef } from "react";
import type { ChatMessage } from "../generated/schema";
import { getProfilePictureUrl } from "../utils/userImages";

interface ProfileLiveChatProps {
  initialMessages: ChatMessage[];
  isLive?: boolean;
  /** Maximum height (px) of the chat scroll area. Default: 420 */
  chatMaxHeight?: number;
  /** Called when the user requests older messages */
  onLoadMore?: () => void;
  /** Whether there are more pages to load */
  hasMore?: boolean;
  /** Whether a load-more request is in-flight */
  loadingMore?: boolean;
}

function formatChatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
  } catch {
    return "";
  }
}

import { useState } from "react";

function ChatAvatar({
  username,
  profilePicture,
}: {
  username: string;
  profilePicture?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = profilePicture && !imgError;
  if (showImg) {
    return (
      <img
        src={getProfilePictureUrl({ profilePicture })}
        alt={username}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-700"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 ring-1 ring-gray-600">
      {username?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export function ProfileLiveChat({
  initialMessages,
  isLive,
  chatMaxHeight = 420,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: ProfileLiveChatProps) {
  // Reverse messages so newest is at the bottom
  const messages = [...initialMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Scroll to bottom only when a new message is appended (not when older ones are prepended)
  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    prevCountRef.current = curr;
    // If a message was appended at the end, scroll to bottom
    if (curr > prev) {
      const lastMsg = messages[curr - 1];
      const prevLastMsg = prev > 0 ? messages[prev - 1] : null;
      if (lastMsg !== prevLastMsg) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <i className="pi pi-comments text-red-500 text-sm" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Live Chat
        </span>
        {isLive && (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Load older messages */}
      {hasMore && (
        <div className="flex justify-center px-4 pt-3">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-xs text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 rounded px-3 py-1 transition-colors"
          >
            {loadingMore ? "Loading…" : "Load older messages"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="overflow-y-auto px-4 py-3 space-y-3"
        style={{ maxHeight: chatMaxHeight, overscrollBehavior: "contain" }}
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No messages yet.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={`${msg.createdAt}-${i}`} className="flex gap-2 items-start">
              <ChatAvatar
                username={msg.publicUser?.username ?? "?"}
                profilePicture={msg.publicUser?.profilePicture}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-200 truncate">
                    {msg.publicUser?.username ?? "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatChatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words leading-snug mt-0.5">
                  {msg.text}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
