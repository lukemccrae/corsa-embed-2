import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { appsyncSubscribe } from "../helpers/appsync-subscription.helper";
import { ON_NEW_CHAT_MESSAGE } from "../helpers/queries";
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
    const unsub = appsyncSubscribe<{ onNewChatMessage: ChatMessage }>(
      ON_NEW_CHAT_MESSAGE,
      { streamId },
      apiToken,
      (data) => {
        if (data.onNewChatMessage) {
          setMessages((prev) => [...prev, data.onNewChatMessage]);
        }
      }
    );
    return unsub;
  }, [streamId, apiToken]);

  return (
    <div className="ce-chat">
      <h3 className="ce-section-title">Live Chat</h3>
      <div className="ce-chat-messages">
        {messages.length === 0 && (
          <p className="ce-chat-empty">No messages yet. Be the first!</p>
        )}
        {messages.map((msg) => {
          const avatarUrl = resolveImageUrl(msg.authorAvatarKey);
          return (
            <div key={msg.id} className="ce-chat-message">
              <div className="ce-chat-avatar">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={msg.authorDisplayName}
                    className="ce-chat-avatar-img"
                  />
                ) : (
                  <div className="ce-chat-avatar-placeholder">
                    {initialsAvatar(msg.authorDisplayName)}
                  </div>
                )}
              </div>
              <div className="ce-chat-content">
                <span className="ce-chat-author">{msg.authorDisplayName}</span>
                <span className="ce-chat-time">{relativeTime(msg.createdAt)}</span>
                <p className="ce-chat-text">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
