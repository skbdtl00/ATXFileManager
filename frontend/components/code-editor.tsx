"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

interface CodeEditorProps {
  onClose: () => void
  fileName: string
  initialCode?: string
}

export function CodeEditor({ onClose, fileName, initialCode = "" }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [monaco, setMonaco] = useState<any>(null)
  const [editor, setEditor] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    let mounted = true

    const initMonaco = async () => {
      const monacoEditor = await import("monaco-editor")

      if (!mounted) return

      // Configure Monaco
      monacoEditor.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#09090b",
          "editor.foreground": "#fafafa",
          "editor.lineHighlightBackground": "#18181b",
          "editorLineNumber.foreground": "#52525b",
        },
      })

      monacoEditor.editor.defineTheme("custom-light", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#09090b",
          "editor.lineHighlightBackground": "#f4f4f5",
          "editorLineNumber.foreground": "#a1a1aa",
        },
      })

      setMonaco(monacoEditor)
    }

    initMonaco()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!monaco || !editorRef.current) return

    // Detect language from file extension
    const extension = fileName.split(".").pop() || ""
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      rs: "rust",
      go: "go",
      md: "markdown",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    }

    const language = languageMap[extension] || "plaintext"

    const editorInstance = monaco.editor.create(editorRef.current, {
      value: initialCode,
      language,
      theme: theme === "dark" ? "custom-dark" : "custom-light",
      fontSize: 14,
      fontFamily: "monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: "on",
      renderWhitespace: "selection",
      tabSize: 2,
      wordWrap: "on",
    })

    setEditor(editorInstance)

    return () => {
      editorInstance.dispose()
    }
  }, [monaco, fileName, initialCode, theme])

  useEffect(() => {
    if (editor && monaco) {
      monaco.editor.setTheme(theme === "dark" ? "custom-dark" : "custom-light")
    }
  }, [theme, editor, monaco])

  const handleCopy = () => {
    if (editor) {
      const code = editor.getValue()
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-accent/80" />
              <div className="w-3 h-3 rounded-full bg-primary/80" />
            </div>
            <span className="text-sm font-mono font-medium text-foreground">{fileName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div ref={editorRef} className="w-full h-full" />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground font-mono">
          <span>{fileName}</span>
          <span>UTF-8</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
