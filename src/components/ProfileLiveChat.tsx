import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../generated/schema";
import { getProfilePictureUrl } from "../utils/userImages";
import { useTheme } from "./ThemeProvider";

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
  /** Username for Corsa profile link */
  username: string;
  /** Stream ID for Corsa profile link */
  streamId: string;
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
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-200 ring-1 ring-white/10">
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
  username,
  streamId,
}: ProfileLiveChatProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const surface = isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-800";
  const borderColor = isDark ? "border-gray-800" : "border-gray-200";
  const subtleText = isDark ? "text-gray-400" : "text-gray-500";
  const bodyText = isDark ? "text-gray-200" : "text-gray-800";

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
    <div className={`flex flex-col ${surface}`}>
      {/* Header */}
      <div className={`ce-section-header ${borderColor}`}>
        <i className="pi pi-comments text-red-500 text-sm" />
        <span className="ce-section-title">
          Chat
        </span>
        {isLive && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-red-400">
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
            className={`text-[11px] font-medium ${subtleText} hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed border ${borderColor} rounded-full px-3 py-1 transition-colors`}
          >
            {loadingMore ? "Loading…" : "Load older messages"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="ce-chat-scroll overflow-y-auto px-4 py-3 space-y-3"
        style={{ maxHeight: chatMaxHeight, overscrollBehavior: "contain" }}
      >
        {messages.length === 0 ? (
          <p className={`${subtleText} text-sm text-center py-4`}>
            No messages yet.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={`${msg.createdAt}-${i}`} className="flex gap-3 items-start">
              <ChatAvatar
                username={msg.publicUser?.username ?? "?"}
                profilePicture={msg.publicUser?.profilePicture}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm font-semibold ${bodyText} truncate`}>
                    {msg.publicUser?.username ?? "Unknown"}
                  </span>
                  <span className={`text-[11px] ${subtleText} flex-shrink-0`}>
                    {formatChatTime(msg.createdAt)}
                  </span>
                </div>
                <p className={`text-sm ${bodyText} break-words leading-5 mt-0.5`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {/* Corsa site link button */}
      <div className={`flex flex-col items-center gap-2 p-4 border-t ${borderColor} ${isDark ? "bg-gray-900/80" : "bg-gray-100"}`}>
        <p className={`text-xs ${subtleText}`}>Sign in on Corsa to join the chat.</p>
        <a
          href={`https://www.corsa.run/profile/${username}/stream/${streamId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow transition-colors"
        >
          Open chat on Corsa
        </a>
      </div>
    </div>
  );
}
