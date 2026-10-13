// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Files Module Workspace (Phase 2.2 Explorer Intelligence Layer)
// Design Frozen UI — Multi-Selection Engine, Debounced Search, Row Key Navigation
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Search,
  LayoutGrid,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Edit3,
  Share2,
  ArrowUpDown,
  ListFilter,
  MoreVertical,
  Star,
  Pin,
  Monitor,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  HardDrive,
  Network,
  Folder,
  FolderDown,
  FileCode,
  FileSpreadsheet,
  FileVideo,
  Presentation,
  Send,
  RotateCcw,
  Sparkles,
  ChevronRight,
  FilePlus,
  FolderPlus,
  Eye,
  AlertCircle,
} from 'lucide-react'
import {
  scaledTypography,
  scaledIcons,
  scaledHeights,
  scaledPadding,
} from '../../../shared/theme/scaleTokens'
import {
  useFilesStore,
  FileItem,
  PreviewEngineService,
  FileAIEngine,
  useFileKeyboardShortcuts,
  AIResponse,
} from '../../../entities/files'

export default function FilesWorkspace() {
  const {
    loading,
    error,
    navigation,
    searchQuery,
    selectedItems,
    selectedDrive,
    viewMode,
    contextMenu,
    currentPath,
    loadUserDirs,
    loadDirectory,
    goBack,
    goForward,
    goToParent,
    navigateTo,
    openDesktop,
    openDownloads,
    openDocuments,
    openPictures,
    openVideos,
    openMusic,
    openDrive,
    openNetwork,
    setSearchQuery,
    selectItem,
    toggleSelection,
    selectRange,
    openItem,
    showContextMenu,
    closeContextMenu,
    createFolder,
    createTextFile,
    createMarkdown,
    cutItem,
    copyItem,
    pasteItem,
    deleteItem,
    renameItem,
    shareItem,
    sortByName,
    sortByDate,
    sortByType,
    sortBySize,
    sortByExtension,
    setViewMode,
    getFilteredAndSortedFiles,
    getSelectedItem,
  } = useFilesStore()

  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false)
  const [showNewMenu, setShowNewMenu] = useState<boolean>(false)
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const [renameValue, setRenameValue] = useState<string>('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUserDirs()
    loadDirectory('C:\\Users\\Jarvis\\Downloads')
  }, [])

  const filteredFiles = getFilteredAndSortedFiles()
  const selectedItem = getSelectedItem()
  const previewMeta = PreviewEngineService.getPreview(selectedItem || null)

  const canGoBack = navigation.historyIndex > 0
  const canGoForward = navigation.historyIndex < navigation.history.length - 1
  const canGoUp = navigation.currentPath.length > 1

  const handleStartRename = () => {
    if (!selectedItem) return
    setRenameValue(selectedItem.name)
    setIsRenaming(true)
    closeContextMenu()
  }

  const handleConfirmRename = () => {
    if (selectedItem && renameValue.trim()) {
      renameItem(selectedItem.path || selectedItem.id || '', renameValue.trim())
    }
    setIsRenaming(false)
  }

  useFileKeyboardShortcuts(searchInputRef, handleStartRename)

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!aiPrompt.trim()) return

    setIsAiLoading(true)
    const response = await FileAIEngine.askAI(aiPrompt, selectedItem || null)
    setAiResponse(response)
    setIsAiLoading(false)
    setAiPrompt('')
  }

  // Row selection handler supporting Single Click, Ctrl + Click (Multi-select), and Shift + Click (Range select)
  const handleRowClick = (e: React.MouseEvent, itemPath: string) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelection(itemPath)
    } else if (e.shiftKey) {
      selectRange(itemPath)
    } else {
      selectItem(itemPath)
    }
  }

  const renderIcon = (type: FileItem['iconType']) => {
    const size = scaledIcons.medium16 // 11px
    switch (type) {
      case 'folder':
        return <Folder size={size} className="text-amber-400 fill-amber-400/20" />
      case 'downloads':
        return <FolderDown size={size} className="text-emerald-400 fill-emerald-400/20" />
      case 'pictures':
        return <ImageIcon size={size} className="text-cyan-400" />
      case 'videos':
        return <Film size={size} className="text-purple-400" />
      case 'music':
        return <Music size={size} className="text-rose-400" />
      case 'txt':
        return <FileText size={size} className="text-cyan-300" />
      case 'md':
        return <FileCode size={size} className="text-blue-400" />
      case 'pdf':
        return <FileText size={size} className="text-red-400" />
      case 'pptx':
        return <Presentation size={size} className="text-orange-400" />
      case 'xlsx':
        return <FileSpreadsheet size={size} className="text-emerald-400" />
      case 'mp4':
        return <FileVideo size={size} className="text-purple-400" />
      case 'png':
        return <ImageIcon size={size} className="text-[#00D9FF]" />
      case 'js':
        return <FileCode size={size} className="text-yellow-400" />
      default:
        return <Folder size={size} className="text-amber-400" />
    }
  }

  return (
    <div
      onClick={() => {
        if (contextMenu.isOpen) closeContextMenu()
        if (showNewMenu) setShowNewMenu(false)
        if (showSortMenu) setShowSortMenu(false)
      }}
      className="flex flex-col h-full w-full bg-[#050505] text-[#F5F5F5] font-sans overflow-hidden select-none relative"
    >
      {/* ── PAGE TITLE ─────────────────────────────────────────────────── */}
      <div className="mt-1 mb-1 flex items-center justify-between px-1 flex-shrink-0">
        <h1
          style={{ fontSize: scaledTypography.title24 }}
          className="font-mono font-bold tracking-[0.12em] bg-gradient-to-r from-[#00D9FF] via-[#A855F7] to-[#FF00AA] bg-clip-text text-transparent"
        >
          FILES MODULE ACTIVE
        </h1>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col rounded-[10px] border border-white/[0.08] bg-[#0C0C0C] overflow-hidden shadow-2xl w-full min-h-0">
        
        {/* ── TOOLBAR 1 (Explorer Toolbar) ─────────────────────────────── */}
        <div
          style={{ height: scaledHeights.h42, paddingLeft: scaledPadding.p12, paddingRight: scaledPadding.p12 }}
          className="bg-[#0C0C0C] border-b border-white/[0.08] flex items-center justify-between gap-1 flex-shrink-0"
        >
          {/* Navigation Controls & Breadcrumbs */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-0.5 text-white/60">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                className={`p-0.5 rounded hover:bg-white/5 transition-colors ${
                  canGoBack ? 'hover:text-white cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                title="Back (Ctrl+Left)"
              >
                <ArrowLeft size={scaledIcons.small14} />
              </button>
              <button
                type="button"
                onClick={goForward}
                disabled={!canGoForward}
                className={`p-0.5 rounded hover:bg-white/5 transition-colors ${
                  canGoForward ? 'hover:text-white cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                title="Forward (Ctrl+Right)"
              >
                <ArrowRight size={scaledIcons.small14} />
              </button>
              <button
                type="button"
                onClick={goToParent}
                disabled={!canGoUp}
                className={`p-0.5 rounded hover:bg-white/5 transition-colors ${
                  canGoUp ? 'hover:text-white cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                title="Up directory"
              >
                <ArrowUp size={scaledIcons.small14} />
              </button>
            </div>

            {/* Breadcrumb Bar */}
            <div
              style={{ height: scaledHeights.h34, fontSize: scaledTypography.body13 }}
              className="flex items-center gap-1 bg-[#121212] border border-white/[0.08] rounded-[5px] px-2 font-mono text-white/80 flex-1 max-w-xl overflow-x-auto hide-scrollbar"
            >
              {navigation.currentPath.map((item, idx) => (
                <React.Fragment key={item}>
                  {idx > 0 && <ChevronRight size={scaledIcons.tiny12} className="text-white/40 flex-shrink-0" />}
                  <button
                    type="button"
                    onClick={() => navigateTo(navigation.currentPath.slice(0, idx + 1))}
                    className={`cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                      idx === navigation.currentPath.length - 1 ? 'text-white font-semibold' : 'text-white/70'
                    }`}
                  >
                    {item}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Search Bar & Layout Controls */}
          <div className="flex items-center gap-1">
            <div className="relative w-48">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in Jarvis (Ctrl+F)"
                style={{ height: scaledHeights.h36, fontSize: scaledTypography.body13 }}
                className="w-full bg-[#121212] border border-white/[0.10] rounded-[5px] py-0.5 pl-2 pr-6 text-white placeholder-white/40 focus:outline-none focus:border-[#00D9FF]/50 transition-colors"
              />
              <Search size={scaledIcons.small14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40" />
            </div>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`p-1 rounded-[5px] border border-white/[0.08] transition-colors ${
                viewMode === 'grid' ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/50' : 'bg-white/[0.03] text-white/70 hover:text-white'
              }`}
              title="Toggle Layout (List/Grid)"
            >
              <LayoutGrid size={scaledIcons.small14} />
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'compact' ? 'list' : 'compact')}
              className={`p-1 rounded-[5px] border border-white/[0.08] transition-colors ${
                viewMode === 'compact' ? 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/50' : 'bg-white/[0.03] text-white/70 hover:text-white'
              }`}
              title="Toggle Compact View"
            >
              <SlidersHorizontal size={scaledIcons.small14} />
            </button>
          </div>
        </div>

        {/* ── TOOLBAR 2 (Actions Toolbar) ────────────────────────────────── */}
        <div
          style={{ height: scaledHeights.h40, paddingLeft: scaledPadding.p12, paddingRight: scaledPadding.p12, fontSize: scaledTypography.body13 }}
          className="bg-[#0A0A0A] border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 relative"
        >
          <div className="flex items-center gap-1.5">
            {/* + New Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowNewMenu(!showNewMenu)
                }}
                className="flex items-center gap-1 bg-white/[0.06] hover:bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-[5px] text-white font-medium transition-colors duration-150"
              >
                <Plus size={scaledIcons.small14} className="text-[#00D9FF]" />
                <span>New</span>
                <ChevronDown size={scaledIcons.tiny12} className="text-white/50" />
              </button>

              {showNewMenu && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-[#0E0E12] border border-white/10 rounded-md shadow-xl py-1 z-30 text-[10px]">
                  <button
                    onClick={() => { createFolder(); setShowNewMenu(false) }}
                    className="w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/80"
                  >
                    <FolderPlus size={11} className="text-amber-400" />
                    <span>New Folder</span>
                  </button>
                  <button
                    onClick={() => { createTextFile(); setShowNewMenu(false) }}
                    className="w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/80"
                  >
                    <FilePlus size={11} className="text-cyan-400" />
                    <span>Text Document</span>
                  </button>
                  <button
                    onClick={() => { createMarkdown(); setShowNewMenu(false) }}
                    className="w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/80"
                  >
                    <FileCode size={11} className="text-blue-400" />
                    <span>Markdown File</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-3 w-[1px] bg-white/10 mx-0.5" />

            {/* Operations */}
            <button
              type="button"
              onClick={() => cutItem()}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              title="Cut (Ctrl+X)"
            >
              <Scissors size={scaledIcons.medium16} />
              <span>Cut</span>
            </button>

            <button
              type="button"
              onClick={() => copyItem()}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              title="Copy (Ctrl+C)"
            >
              <Copy size={scaledIcons.medium16} />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={() => pasteItem()}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              title="Paste (Ctrl+V)"
            >
              <Clipboard size={scaledIcons.medium16} />
              <span>Paste</span>
            </button>

            <button
              type="button"
              onClick={() => deleteItem()}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              title="Delete (Delete)"
            >
              <Trash2 size={scaledIcons.medium16} />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={handleStartRename}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              title="Rename (F2)"
            >
              <Edit3 size={scaledIcons.medium16} />
              <span>Rename</span>
            </button>

            <button
              type="button"
              onClick={() => shareItem()}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
            >
              <Share2 size={scaledIcons.medium16} />
              <span>Share</span>
            </button>

            <div className="h-3 w-[1px] bg-white/10 mx-0.5" />

            {/* Sort & View Options */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSortMenu(!showSortMenu)
                }}
                className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
              >
                <ArrowUpDown size={scaledIcons.medium16} />
                <span>Sort</span>
                <ChevronDown size={scaledIcons.tiny12} className="text-white/50" />
              </button>

              {showSortMenu && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#0E0E12] border border-white/10 rounded-md shadow-xl py-1 z-30 text-[10px]">
                  <button onClick={() => { sortByName(); setShowSortMenu(false) }} className="w-full px-2 py-1 text-left hover:bg-white/10 text-white/80">Sort by Name</button>
                  <button onClick={() => { sortByDate(); setShowSortMenu(false) }} className="w-full px-2 py-1 text-left hover:bg-white/10 text-white/80">Sort by Date</button>
                  <button onClick={() => { sortByType(); setShowSortMenu(false) }} className="w-full px-2 py-1 text-left hover:bg-white/10 text-white/80">Sort by Type</button>
                  <button onClick={() => { sortBySize(); setShowSortMenu(false) }} className="w-full px-2 py-1 text-left hover:bg-white/10 text-white/80">Sort by Size</button>
                  <button onClick={() => { sortByExtension(); setShowSortMenu(false) }} className="w-full px-2 py-1 text-left hover:bg-white/10 text-white/80">Sort by Extension</button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1 text-white/70 hover:text-white font-medium transition-colors duration-150 px-1 py-0.5"
            >
              <ListFilter size={scaledIcons.medium16} />
              <span>View</span>
              <ChevronDown size={scaledIcons.tiny12} className="text-white/50" />
            </button>
          </div>

          <button type="button" className="text-white/60 hover:text-white p-0.5 rounded transition-colors" title="More Options">
            <MoreVertical size={scaledIcons.medium16} />
          </button>
        </div>

        {/* ── WORKSPACE BODY (CSS Grid Layout Engine) ────────────────────── */}
        <div
          className="grid flex-1 overflow-hidden min-h-0"
          style={{ gridTemplateColumns: '170px minmax(0, 1fr) 220px' }}
        >

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <div
            style={{ padding: scaledPadding.p12 }}
            className="w-[170px] min-w-[170px] max-w-[170px] bg-[#090d16]/90 border-r border-white/[0.08] flex flex-col gap-1.5 overflow-y-auto hide-scrollbar select-none"
          >
            {/* Quick Access */}
            <div>
              <div
                style={{ fontSize: scaledTypography.caption12 }}
                className="flex items-center gap-1 font-semibold text-white/50 tracking-wider mb-0.5 px-0.5"
              >
                <Star size={scaledIcons.tiny12} className="text-amber-400" />
                <span>Quick Access</span>
              </div>
              <div className="space-y-0.5">
                {[
                  { name: 'Desktop', icon: Monitor, color: 'text-cyan-400', action: openDesktop },
                  { name: 'Downloads', icon: Download, color: 'text-emerald-400', action: openDownloads },
                  { name: 'Documents', icon: FileText, color: 'text-blue-400', action: openDocuments },
                  { name: 'Pictures', icon: ImageIcon, color: 'text-cyan-300', action: openPictures },
                  { name: 'Videos', icon: Film, color: 'text-purple-400', action: openVideos },
                  { name: 'Music', icon: Music, color: 'text-rose-400', action: openMusic },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={item.action}
                    style={{ height: scaledHeights.h40, fontSize: scaledTypography.sidebar15 }}
                    className="w-full flex items-center justify-between px-1.5 rounded-[5px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <item.icon size={scaledIcons.standard18} className={item.color} />
                      <span>{item.name}</span>
                    </div>
                    <Pin size={scaledIcons.tiny12} className="text-white/30" />
                  </button>
                ))}
              </div>
            </div>

            {/* This PC */}
            <div>
              <div
                style={{ fontSize: scaledTypography.caption12 }}
                className="flex items-center gap-1 font-semibold text-white/50 tracking-wider mb-0.5 px-0.5"
              >
                <Monitor size={scaledIcons.tiny12} className="text-blue-400" />
                <span>This PC</span>
              </div>
              <div className="space-y-0.5">
                {[
                  { id: 'C:', name: 'Windows (C:)', icon: HardDrive },
                  { id: 'D:', name: 'Data (D:)', icon: HardDrive },
                ].map((drive) => {
                  const isSelected = selectedDrive === drive.id
                  return (
                    <button
                      key={drive.id}
                      type="button"
                      onClick={() => openDrive(drive.id, drive.name)}
                      style={{ height: scaledHeights.h40, fontSize: scaledTypography.sidebar15 }}
                      className={`w-full flex items-center gap-1.5 px-1.5 rounded-[5px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] border border-white/10 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <drive.icon size={scaledIcons.standard18} className={isSelected ? 'text-[#00D9FF]' : 'text-white/50'} />
                      <span>{drive.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Network */}
            <div>
              <button
                type="button"
                onClick={openNetwork}
                style={{ height: scaledHeights.h40, fontSize: scaledTypography.sidebar15 }}
                className="w-full flex items-center gap-1.5 px-1.5 rounded-[5px] text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors font-medium cursor-pointer"
              >
                <Network size={scaledIcons.standard18} className="text-purple-400" />
                <span>Network</span>
              </button>
            </div>
          </div>

          {/* ── CENTER TABLE ─────────────────────────────────────────────── */}
          <div
            style={{ padding: scaledPadding.p12 }}
            className="bg-[#070a11] flex flex-col overflow-hidden min-w-0 relative"
          >
            {loading && (
              <div className="absolute inset-0 bg-[#070a11]/70 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <div className="text-[9px] font-mono text-[#00D9FF] animate-pulse">Reading Windows Directory...</div>
              </div>
            )}

            {error && !loading && (
              <div className="p-2 m-2 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-red-400 text-[10px] font-mono">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Column Headers */}
            <div
              style={{ fontSize: scaledTypography.caption12 }}
              className="flex items-center px-2 py-0.5 border-b border-white/[0.08] font-medium text-white/50 mb-0.5 flex-shrink-0 cursor-pointer"
            >
              <div className="w-[36%]" onClick={sortByName}>Name</div>
              <div className="w-[24%]" onClick={sortByDate}>Date modified</div>
              <div className="w-[22%]" onClick={sortByType}>Type</div>
              <div className="w-[18%] text-right pr-1" onClick={sortBySize}>Size</div>
            </div>

            {/* Rows Container (Phase 2.2 — Multi-selection, Range selection, Keyboard navigation) */}
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-0.5 min-h-0">
              {filteredFiles.map((file) => {
                const itemKey = file.path || file.id || file.name
                const isSelected = selectedItems.includes(itemKey)
                return (
                  <div
                    key={itemKey}
                    onClick={(e) => handleRowClick(e, itemKey)}
                    onDoubleClick={() => openItem(file)}
                    onContextMenu={(e) => showContextMenu(e, file)}
                    style={{ height: scaledHeights.h40 }}
                    className={`flex items-center px-2 rounded-[5px] transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-white/[0.08] border-[#00D9FF]/40 text-white font-medium shadow-sm'
                        : 'border-transparent text-white/80 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {/* Name column (36%) */}
                    <div className="w-[36%] flex items-center gap-1.5 min-w-0 pr-1">
                      <div className="flex-shrink-0">{renderIcon(file.iconType || (file.isDirectory ? 'folder' : 'txt'))}</div>
                      {isRenaming && isSelected ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                          onBlur={handleConfirmRename}
                          autoFocus
                          className="bg-[#121212] text-white px-1 py-0.5 rounded border border-[#00D9FF] text-[9px] w-full focus:outline-none"
                        />
                      ) : (
                        <span style={{ fontSize: scaledTypography.text14 }} className="truncate font-medium">
                          {file.name}
                        </span>
                      )}
                    </div>

                    {/* Date modified column (24%) */}
                    <div style={{ fontSize: scaledTypography.caption12 }} className="w-[24%] text-white/60 font-mono truncate">
                      {file.dateModified || '30-07-2026 12:40 PM'}
                    </div>

                    {/* Type column (22%) */}
                    <div style={{ fontSize: scaledTypography.body13 }} className="w-[22%] text-white/60 truncate">
                      {file.type || (file.isDirectory ? 'File folder' : 'Document')}
                    </div>

                    {/* Size column (18%) */}
                    <div style={{ fontSize: scaledTypography.caption12 }} className="w-[18%] text-right font-mono text-white/60 pr-1 truncate">
                      {file.sizeFormatted || '--'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT PREVIEW PANEL (Format-Specific Preview Engine) ───────── */}
          <div
            style={{ padding: scaledPadding.p12 }}
            className="w-[220px] min-w-[220px] max-w-[220px] bg-[#090d16]/90 border-l border-white/[0.08] flex flex-col justify-between overflow-y-auto hide-scrollbar relative"
          >
            <div>
              <h3 style={{ fontSize: scaledTypography.header16 }} className="font-semibold text-white/80 mb-1.5">
                Preview
              </h3>

              {/* Format-Specific Thumbnail Box */}
              <div className="w-full aspect-video rounded-[6px] bg-gradient-to-b from-[#0B1324] to-[#060A12] border border-[#00D9FF]/40 p-1.5 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(0,217,255,0.12)]">
                <div className="absolute inset-0 bg-[radial-gradient(#00D9FF_1px,transparent_1px)] [background-size:6px_6px] opacity-15" />

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                  {previewMeta.type === 'image' && previewMeta.previewUrl ? (
                    <img
                      src={previewMeta.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-[4px]"
                    />
                  ) : previewMeta.type === 'video' ? (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      <Film size={20} />
                      <span className="text-[8px] font-mono text-white/70 mt-1">MP4 Video Player</span>
                    </div>
                  ) : previewMeta.type === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center text-red-400">
                      <FileText size={20} />
                      <span className="text-[8px] font-mono text-white/70 mt-1">PDF Reader</span>
                    </div>
                  ) : previewMeta.type === 'text' ? (
                    <div className="text-[7.5px] font-mono text-white/70 p-1 line-clamp-3 overflow-hidden text-left w-full">
                      {previewMeta.textContent}
                    </div>
                  ) : (
                    <div className="w-12 h-9 rounded-[4px] border-2 border-[#00D9FF] bg-[#00D9FF]/10 flex items-center justify-center shadow-[0_0_10px_rgba(0,217,255,0.35)] relative">
                      <div className="absolute -top-1 left-1 w-4 h-1 bg-[#00D9FF] rounded-t-sm" />
                      <FolderDown size={scaledIcons.medium16} className="text-[#00D9FF]" />
                    </div>
                  )}
                </div>
              </div>

              {/* File Title & Subtitle */}
              <div className="mt-2">
                <h4 style={{ fontSize: scaledTypography.header16 }} className="font-bold text-white tracking-tight truncate" title={selectedItem ? selectedItem.name : 'Downloads'}>
                  {selectedItem ? selectedItem.name : 'Downloads'}
                </h4>
                <p style={{ fontSize: scaledTypography.body13 }} className="text-white/50 mt-0.5">
                  {selectedItem ? selectedItem.type || (selectedItem.isDirectory ? 'File folder' : 'Document') : 'File folder'}
                </p>
              </div>

              {/* Details List */}
              <div className="mt-2 space-y-1">
                <h5 style={{ fontSize: scaledTypography.caption12 }} className="font-semibold text-white/40 uppercase tracking-wider mb-0.5">
                  Details
                </h5>
                <div style={{ fontSize: scaledTypography.caption12 }} className="space-y-0.5 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-sans">Type:</span>
                    <span className="text-white/80 truncate max-w-[120px]">{selectedItem ? selectedItem.type || 'Document' : 'File folder'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-sans">Location:</span>
                    <span className="text-white/80 truncate font-mono max-w-[120px]" title={selectedItem ? selectedItem.path : currentPath}>
                      {selectedItem ? selectedItem.path : currentPath}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-sans">Size:</span>
                    <span className="text-white/80">
                      {previewMeta.sizeFormatted || (selectedItem ? selectedItem.sizeFormatted : '12.6 GB')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-sans">Created:</span>
                    <span className="text-white/80">{previewMeta.createdDate || '14-02-2026 10:22 AM'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-sans">Modified:</span>
                    <span className="text-white/80">{selectedItem ? selectedItem.dateModified || '30-07-2026' : '30-07-2026'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant Section */}
            <div className="mt-2 pt-1 border-t border-white/[0.08] relative">
              <div style={{ fontSize: scaledTypography.caption12 }} className="flex items-center justify-between font-semibold text-[#A855F7] mb-0.5">
                <div className="flex items-center gap-1">
                  <Sparkles size={scaledIcons.tiny12} />
                  <span>AI Assistant</span>
                </div>
                {isAiLoading && <span className="text-[7.5px] animate-pulse text-[#00D9FF]">Analyzing...</span>}
              </div>

              {/* Dynamic AI Output */}
              {aiResponse && (
                <div className="mb-1 p-1 bg-[#121218] border border-[#A855F7]/30 rounded text-[7.5px] font-mono text-white/90">
                  <div className="text-[#A855F7] font-semibold flex items-center gap-1 mb-0.5">
                    <Sparkles size={9} />
                    <span>JARVIS Response</span>
                  </div>
                  <p>{aiResponse.text}</p>
                </div>
              )}

              <form
                onSubmit={handleAskAI}
                style={{ height: scaledHeights.h36 }}
                className="relative w-full bg-[#121212] border border-white/[0.12] rounded-[5px] px-2 flex items-center justify-between"
              >
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask about this item..."
                  style={{ fontSize: scaledTypography.caption12 }}
                  className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none pr-4 font-sans"
                />
                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="text-white/40 hover:text-[#00D9FF] transition-colors p-0.5"
                  title="Send query"
                >
                  <Send size={scaledIcons.tiny12} />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ── FOOTER BAR (Step 7 Footer Synchronization) ────────────────── */}
        <div
          style={{ height: scaledHeights.h36, paddingLeft: scaledPadding.p12, paddingRight: scaledPadding.p12, fontSize: scaledTypography.caption12 }}
          className="bg-[#06080e] border-t border-white/[0.08] flex items-center justify-between font-mono text-white/70 flex-shrink-0"
        >
          <div>
            {selectedItems.length === 1
              ? '1 item selected'
              : `${selectedItems.length} items selected`}
          </div>
          <div>Total items: {filteredFiles.length}</div>
          <div className="flex items-center gap-1.5">
            <span>Free space: 312 GB</span>
            <button
              type="button"
              onClick={() => loadDirectory(currentPath)}
              className="p-0.5 rounded border border-[#00D9FF]/40 bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors"
              title="Refresh Storage Info"
            >
              <RotateCcw size={scaledIcons.tiny12} />
            </button>
          </div>
        </div>

      </div>

      {/* ── FLOATING CONTEXT MENU (Step 5 Context Menu) ─────────────────── */}
      {contextMenu.isOpen && contextMenu.targetItem && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed w-36 bg-[#0E0E12] border border-white/10 rounded-md shadow-2xl py-1 z-50 text-[10px] select-none"
        >
          <button
            onClick={() => { openItem(contextMenu.targetItem!); closeContextMenu() }}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/90"
          >
            <Eye size={11} className="text-cyan-400" />
            <span>Open</span>
          </button>
          <button
            onClick={() => handleStartRename()}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/90"
          >
            <Edit3 size={11} className="text-amber-400" />
            <span>Rename (F2)</span>
          </button>
          <button
            onClick={() => { copyItem(contextMenu.targetItem!); closeContextMenu() }}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/90"
          >
            <Copy size={11} className="text-blue-400" />
            <span>Copy (Ctrl+C)</span>
          </button>
          <button
            onClick={() => { cutItem(contextMenu.targetItem!); closeContextMenu() }}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/90"
          >
            <Scissors size={11} className="text-purple-400" />
            <span>Cut (Ctrl+X)</span>
          </button>
          <button
            onClick={() => { pasteItem(); closeContextMenu() }}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-white/10 text-white/90"
          >
            <Clipboard size={11} className="text-emerald-400" />
            <span>Paste (Ctrl+V)</span>
          </button>
          <div className="h-[1px] bg-white/10 my-0.5" />
          <button
            onClick={() => { deleteItem(contextMenu.targetItem!.path || contextMenu.targetItem!.id); closeContextMenu() }}
            className="w-full px-2.5 py-1 text-left flex items-center gap-1.5 hover:bg-red-500/20 text-red-400"
          >
            <Trash2 size={11} className="text-red-400" />
            <span>Delete (Del)</span>
          </button>
        </div>
      )}
    </div>
  )
}
