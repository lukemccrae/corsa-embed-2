import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../generated/schema";
import { appsyncSubscribe } from "../helpers/appsync-subscription.helper";
import { getProfilePictureUrl } from "../utils/userImages";
import { ON_NEW_CHAT } from "../helpers/queries";

interface ProfileLiveChatProps {
  initialMessages: ChatMessage[];
  streamId: string;
  apiToken: string | null;
  isLive?: boolean;
}

function formatChatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
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
  if (profilePicture) {
    return (
      <img
        src={getProfilePictureUrl({ profilePicture })}
        alt={username}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-700"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 ring-1 ring-gray-600">
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

export function ProfileLiveChat({
  initialMessages,
  streamId,
  apiToken,
  isLive,
}: ProfileLiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Live subscription for new chat messages
  useEffect(() => {
    if (!apiToken || !isLive) return;

    const unsub = appsyncSubscribe<{ onNewChat: ChatMessage }>(
      ON_NEW_CHAT,
      { streamId },
      apiToken,
      (data) => {
        if (data.onNewChat) {
          setMessages((prev) => [...prev, data.onNewChat]);
        }
      }
    );
    return unsub;
  }, [apiToken, isLive, streamId]);

  return (
    <div className="flex flex-col h-full">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
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
