import { useState, useRef, useCallback } from "react";
import { Icon } from "../common/Icon";
import type { MessageAttachment } from "../../types/chat";

export interface ChatInputProps {
  onSend: (text: string) => void;
  pendingAttachments?: MessageAttachment[];
  onFileSelect?: () => void;
  onRemoveAttachment?: (mediaId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  pendingAttachments = [],
  onFileSelect,
  onRemoveAttachment: _onRemoveAttachment,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && pendingAttachments.length === 0) return;
    onSend(text);
    setInput("");
  }, [input, onSend, pendingAttachments.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex items-end gap-2">
      {onFileSelect && (
        <button
          onClick={onFileSelect}
          disabled={disabled}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-50"
        >
          <Icon name="attach_file" size={20} />
        </button>
      )}
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32 disabled:opacity-50"
        style={{ minHeight: "40px" }}
      />
      <button
        onClick={handleSend}
        disabled={
          (!input.trim() && pendingAttachments.length === 0) || disabled
        }
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
      >
        <Icon name="arrow_upward" size={20} />
      </button>
    </div>
  );
}
