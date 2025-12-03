"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Folder,
  File,
  ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  Code,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Star,
  Clock,
  Trash2,
  MoreVertical,
  Upload,
  FolderPlus,
  Home,
  Users,
  Cloud,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { CodeEditor } from "@/components/code-editor"

type FileType = "folder" | "image" | "video" | "audio" | "document" | "code" | "archive" | "file"

interface FileItem {
  id: string
  name: string
  type: FileType
  size?: string
  modified: string
  starred?: boolean
}

const mockFiles: FileItem[] = [
  { id: "1", name: "Projects", type: "folder", modified: "2 days ago" },
  { id: "2", name: "Documents", type: "folder", modified: "1 week ago", starred: true },
  { id: "3", name: "Design Assets", type: "folder", modified: "3 days ago" },
  { id: "4", name: "presentation.pdf", type: "document", size: "2.4 MB", modified: "1 hour ago" },
  { id: "5", name: "website-mockup.fig", type: "image", size: "15.8 MB", modified: "5 hours ago", starred: true },
  { id: "6", name: "demo-video.mp4", type: "video", size: "128 MB", modified: "2 days ago" },
  { id: "7", name: "app.tsx", type: "code", size: "4.2 KB", modified: "30 min ago" },
  { id: "8", name: "background-music.mp3", type: "audio", size: "5.6 MB", modified: "1 week ago" },
  { id: "9", name: "project-files.zip", type: "archive", size: "45 MB", modified: "3 days ago" },
]

const sampleCode = `import React from 'react';

function HelloWorld() {
  const message = "Hello, World!";
  
  return (
    <div className="container">
      <h1>{message}</h1>
      <p>Welcome to the code editor!</p>
    </div>
  );
}

export default HelloWorld;`

const getFileIcon = (type: FileType) => {
  switch (type) {
    case "folder":
      return Folder
    case "image":
      return ImageIcon
    case "video":
      return Video
    case "audio":
      return Music
    case "document":
      return FileText
    case "code":
      return Code
    case "archive":
      return Archive
    default:
      return File
  }
}

export function FileManager() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null)
  const { theme, toggleTheme } = useTheme()

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedFiles(newSelection)
  }

  const openFile = (file: FileItem) => {
    if (file.type === "code") {
      setCurrentFile(file)
      setEditorOpen(true)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-64 border-r border-border bg-card flex flex-col"
          >
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-bold text-foreground">FileCloud</h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {[
                { icon: Home, label: "Home", active: true },
                { icon: Star, label: "Starred", count: 2 },
                { icon: Clock, label: "Recent" },
                { icon: Users, label: "Shared" },
                { icon: Cloud, label: "Cloud Storage", progress: 65 },
                { icon: Trash2, label: "Trash" },
              ].map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Storage</span>
                  <span>65%</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">6.5 GB of 10 GB used</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">All Files</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* File Grid/List */}
          <div className="flex items-center justify-between px-4 pb-4 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search files and folders..." className="pl-10" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>

              <Button variant="outline" size="icon">
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* File Grid/List */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {mockFiles.map((file, index) => {
                  const Icon = getFileIcon(file.type)
                  const isSelected = selectedFiles.has(file.id)

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleFileSelection(file.id)}
                      onDoubleClick={() => openFile(file)}
                      className={cn(
                        "group relative bg-card border border-border rounded-lg p-4 cursor-pointer transition-colors",
                        isSelected && "ring-2 ring-primary border-primary",
                      )}
                    >
                      {file.starred && <Star className="absolute top-3 right-3 w-4 h-4 fill-accent text-accent" />}

                      <div className="flex flex-col items-center gap-3">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-lg flex items-center justify-center transition-colors",
                            file.type === "folder" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
                          )}
                        >
                          <Icon className="w-8 h-8" />
                        </div>

                        <div className="text-center w-full">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{file.size || file.modified}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openFile(file)}>Open</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-1"
              >
                <div className="grid grid-cols-[40px_1fr_120px_120px_40px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <div></div>
                  <div>Name</div>
                  <div>Size</div>
                  <div>Modified</div>
                  <div></div>
                </div>

                {mockFiles.map((file, index) => {
                  const Icon = getFileIcon(file.type)
                  const isSelected = selectedFiles.has(file.id)

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: "var(--color-muted)" }}
                      onClick={() => toggleFileSelection(file.id)}
                      onDoubleClick={() => openFile(file)}
                      className={cn(
                        "grid grid-cols-[40px_1fr_120px_120px_40px] gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors items-center",
                        isSelected && "bg-primary/10",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center",
                          file.type === "folder" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{file.name}</span>
                        {file.starred && <Star className="w-3 h-3 fill-accent text-accent" />}
                      </div>

                      <div className="text-sm text-muted-foreground">{file.size || "—"}</div>

                      <div className="text-sm text-muted-foreground">{file.modified}</div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openFile(file)}>Open</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Code Editor Modal */}
      <AnimatePresence>
        {editorOpen && currentFile && (
          <CodeEditor onClose={() => setEditorOpen(false)} fileName={currentFile.name} initialCode={sampleCode} />
        )}
      </AnimatePresence>
    </div>
  )
}
