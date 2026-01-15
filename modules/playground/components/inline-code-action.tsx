"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Check, X, Copy, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface InlineCodeActionProps {
  position: { top: number; left: number } | null
  selectedCode: string
  onClose: () => void
  onApply: (modifiedCode: string) => void
  fileContent: string
  language: string
}

export const InlineCodeAction = ({
  position,
  selectedCode,
  onClose,
  onApply,
  fileContent,
  language,
}: InlineCodeActionProps) => {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [widgetPosition, setWidgetPosition] = useState(position)

  // Update widget position when initial position changes
  useEffect(() => {
    if (position) {
      setWidgetPosition(position)
    }
  }, [position])

  useEffect(() => {
    if (position && textareaRef.current && !isDragging) {
      textareaRef.current.focus()
    }
  }, [position, isDragging])

  // Handle mouse down on drag handle
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return
    
    const rect = widgetRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      setWidgetPosition({
        left: e.clientX - dragOffset.x,
        top: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsLoading(true)
    setSuggestion(null)

    try {
      const response = await fetch("/api/code-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedCode,
          prompt: prompt.trim(),
          fileContent,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }

      const data = await response.json()

      if (data.modifiedCode) {
        setSuggestion(data.modifiedCode)
        setShowDiff(true)
      } else {
        toast.error("No suggestion received from AI")
      }
    } catch (error) {
      console.error("Error fetching code action:", error)
      toast.error("Failed to get AI suggestion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion)
      toast.success("Code applied successfully")
      onClose()
    }
  }

  const handleCopy = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion)
      toast.success("Code copied to clipboard")
    }
  }

  const handleClose = () => {
    // Reset all local state
    setPrompt("")
    setSuggestion(null)
    setShowDiff(false)
    setIsDragging(false)
    setWidgetPosition(null)
    onClose()
  }

  if (!widgetPosition) return null

  return (
    <div
      ref={widgetRef}
      className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl"
      style={{
        top: widgetPosition.top,
        left: widgetPosition.left,
        width: "400px",
        maxHeight: "500px",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Header with drag handle */}
      <div 
        className="flex items-center justify-between p-3 border-b border-zinc-700 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-zinc-300" />
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-zinc-100">Ask AI to modify code</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0 hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Selected Code Preview */}
        <div className="bg-zinc-800 rounded p-2 max-h-32 overflow-y-auto">
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
            {selectedCode}
          </pre>
        </div>

        {/* Prompt Input */}
        {!showDiff && (
          <>
            <Textarea
              ref={textareaRef}
              placeholder="e.g., Add error handling, Fix the bug, Add comments, Refactor this function..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] bg-zinc-800 border-zinc-700 text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Press Cmd/Ctrl+Enter to submit</span>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Suggestion Display */}
        {showDiff && suggestion && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">AI Suggestion:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-zinc-800 rounded p-2 max-h-48 overflow-y-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                  {suggestion}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
              <Button
                onClick={() => {
                  setShowDiff(false)
                  setSuggestion(null)
                  setPrompt("")
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
