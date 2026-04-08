import { useTheme } from "./ThemeProvider";

const PLACEHOLDER_BUBBLES = [
  { width: "70%", align: "left" },
  { width: "50%", align: "right" },
  { width: "60%", align: "left" },
  { width: "45%", align: "right" },
  { width: "55%", align: "left" },
];

export function ChatPlaceholder() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cardBg = isDark
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";

  const bubbleBg = isDark ? "bg-gray-700" : "bg-gray-200";
  const bubbleBgAlt = isDark ? "bg-gray-600" : "bg-gray-300";

  const inputBg = isDark
    ? "bg-gray-800 border-gray-600 text-gray-500 placeholder-gray-500"
    : "bg-gray-100 border-gray-300 text-gray-400 placeholder-gray-400";

  const headerBorder = isDark ? "border-gray-700" : "border-gray-200";
  const titleColor = isDark ? "text-gray-100" : "text-gray-800";

  return (
    <div className={`ce-chat-placeholder ${cardBg} border rounded-lg shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${headerBorder}`}>
        <span className={`text-sm font-bold uppercase tracking-widest ${titleColor}`}>
          Chat
        </span>
        <span className="text-xs font-semibold bg-gray-500 text-white px-2 py-0.5 rounded-full">
          Coming soon
        </span>
      </div>

      {/* Messages area */}
      <div className="ce-chat-messages flex flex-col gap-3 p-4">
        {PLACEHOLDER_BUBBLES.map((bubble, i) => (
          <div
            key={i}
            className={`flex ${bubble.align === "right" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`ce-skeleton-pulse rounded-2xl h-8 ${bubble.align === "right" ? bubbleBgAlt : bubbleBg}`}
              style={{ width: bubble.width }}
            />
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className={`flex items-center gap-2 px-4 py-3 border-t ${headerBorder}`}>
        <input
          type="text"
          disabled
          placeholder="Chat coming soon"
          className={`flex-1 rounded-full px-4 py-2 text-sm border outline-none cursor-not-allowed ${inputBg}`}
        />
        <button
          disabled
          className="bg-gray-500 text-white text-sm font-semibold px-4 py-2 rounded-full cursor-not-allowed opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
