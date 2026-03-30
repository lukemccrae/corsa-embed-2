import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../generated/schema";
import { appsyncSubscribe } from "../helpers/appsync-subscription.helper";
import { ON_NEW_CHAT } from "../helpers/queries";
import { resolveImageUrl, initialsAvatar } from "../utils/userImages";
import { relativeTime } from "../utils/time";

interface ChatProps {
  streamId: string;
  initialMessages: ChatMessage[];
  apiToken: string;
}

export function Chat({ streamId, initialMessages, apiToken }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
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
  }, [streamId, apiToken]);

  return (
    <div className="ce-chat">
      <div className="ce-section-header">
        <i className="pi pi-comments ce-section-icon" />
        <span className="ce-section-title">Live Chat</span>
      </div>

      <div className="ce-chat-messages">
        {messages.length === 0 && (
          <p className="ce-chat-empty">
            No messages yet. Be the first!
          </p>
        )}
        {messages.map((msg, i) => {
          const avatarUrl = resolveImageUrl(msg.publicUser.profilePicture);
          return (
            <div
              key={`${msg.createdAt}-${msg.userId}-${i}`}
              className="ce-chat-message"
            >
              {/* Avatar */}
              <div className="ce-chat-avatar">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={msg.publicUser.username}
                    className="ce-chat-avatar-img"
                  />
                ) : (
                  <div className="ce-chat-avatar-placeholder">
                    {initialsAvatar(msg.publicUser.username)}
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="ce-chat-content">
                <div>
                  <span className="ce-chat-author">
                    {msg.publicUser.username}
                  </span>
                  <span className="ce-chat-time">
                    {relativeTime(msg.createdAt)}
                  </span>
                </div>
                <p className="ce-chat-text">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
