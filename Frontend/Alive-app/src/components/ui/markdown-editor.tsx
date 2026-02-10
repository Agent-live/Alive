/**
 * Markdown Editor Component
 * Simple textarea with markdown preview toggle
 */

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Eye, Edit3, Columns } from "lucide-react"

type ViewMode = "edit" | "preview" | "split"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  disabled?: boolean
  label?: string
  charCount?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "400px",
  disabled = false,
  label,
  charCount,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit")

  return (
    <div className={cn("flex flex-col border rounded overflow-hidden bg-background h-full", className)}>
      {/* Toolbar - Single Line */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {label && (
            <span className="text-sm font-medium">{label}</span>
          )}
          <span className="text-xs text-muted-foreground">Markdown</span>
        </div>
        <div className="flex items-center gap-2">
          {charCount !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {charCount} chars
            </span>
          )}
          <div className="flex items-center gap-0.5 ml-2">
            <Button
              variant={viewMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => setViewMode("edit")}
            >
              <Edit3 className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => setViewMode("split")}
            >
              <Columns className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Split</span>
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => setViewMode("preview")}
            >
              <Eye className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Preview</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div
        className="flex-1 flex min-h-0"
        style={{ minHeight }}
      >
        {/* Edit Panel */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={cn("flex-1 h-full", viewMode === "split" && "border-r")}>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 text-[15px] leading-relaxed p-4 font-mono"
            />
          </div>
        )}

        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={cn(
              "flex-1 overflow-auto h-full",
              viewMode === "preview" && "w-full"
            )}
          >
            <article className="p-4 text-sm leading-relaxed break-words">
              {value ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                    h2: ({children}) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                    p: ({children}) => <p className="my-2">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="ml-2">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                    code: ({children, className}) => {
                      const isCodeBlock = className?.includes('language-')
                      if (isCodeBlock) {
                        return <code className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto">{children}</code>
                      }
                      return <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    },
                    pre: ({children}) => <pre className="my-2">{children}</pre>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-primary/30 pl-4 my-2 italic text-muted-foreground">{children}</blockquote>,
                    hr: () => <hr className="my-4 border-border" />,
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">{placeholder || "Nothing to preview"}</p>
              )}
            </article>
          </div>
        )}
      </div>
    </div>
  )
}
