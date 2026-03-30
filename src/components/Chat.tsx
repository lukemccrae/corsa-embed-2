import { useEffect, useRef, useState } from "react";
import { Divider } from "primereact/divider";
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
    <div className="ce-chat p-4 bg-[#1a1a1a] border-t border-[#2a2a2a]">
      <div className="flex items-center gap-2 mb-3">
        <i className="pi pi-comments text-[#e53935]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#aaa]">
          Live Chat
        </span>
      </div>
      <Divider className="!mt-0 !mb-3 !border-[#2a2a2a]" />

      <div className="max-h-80 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-[#666] text-sm text-center py-2">
            No messages yet. Be the first!
          </p>
        )}
        {messages.map((msg, i) => {
          const avatarUrl = resolveImageUrl(msg.publicUser.profilePicture);
          return (
            <div
              key={`${msg.createdAt}-${msg.userId}-${i}`}
              className="flex gap-2.5 items-start"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={msg.publicUser.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold text-white">
                    {initialsAvatar(msg.publicUser.username)}
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[#ddd]">
                    {msg.publicUser.username}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {relativeTime(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[#ccc] break-words">
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
