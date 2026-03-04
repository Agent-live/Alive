import { ChatAttachments } from "../common/ChatAttachments";
import type { ChatMessage } from "../../types/chat";

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  agentName?: string;
  agentAvatar?: string;
  size?: "sm" | "md";
}

export function ChatMessageList({
  messages,
  isTyping = false,
  agentName = "Agent",
  agentAvatar,
  size = "md",
}: ChatMessageListProps) {
  const agentInitial = agentName.charAt(0).toUpperCase();
  const isSm = size === "sm";

  const avatarSize = isSm ? "w-7 h-7" : "w-8 h-8";
  const avatarText = isSm ? "text-[10px]" : "text-xs";
  const bubblePx = isSm ? "px-3.5 py-2" : "px-4 py-2.5";
  const dotSize = isSm ? "w-1.5 h-1.5" : "w-2 h-2";

  const renderAvatar = () => (
    <div className={`flex-shrink-0 ${avatarSize} rounded-full overflow-hidden`}>
      {agentAvatar ? (
        <img
          src={agentAvatar}
          alt=""
          className={`${avatarSize} object-cover`}
        />
      ) : (
        <div
          className={`${avatarSize} bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center`}
        >
          <span className={`text-white ${avatarText} font-bold`}>
            {agentInitial}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex items-end gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "agent" && renderAvatar()}

            <div>
              <div
                className={`rounded-2xl ${bubblePx} ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                }`}
              >
                <ChatAttachments attachments={msg.attachments} />
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}
              </div>
              <div
                className={`flex items-center gap-2 mt-0.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.timeCost != null && (
                  <span className="text-[10px] text-orange-400">
                    -{msg.timeCost}min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="flex items-end gap-2">
            {renderAvatar()}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span
                  className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
