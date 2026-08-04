import { useState, useRef } from "react";
import { useEditorStore } from "../store.ts";
import {
  Plus,
  Play,
  Save,
  Undo,
  Redo,
  Box,
  Type,
  Image,
  Link,
  MousePointerClick,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  EyeOff,
  Upload,
  Download,
} from "lucide-react";

const NODE_TYPES = [
  { type: "container" as const, label: "Container", icon: Box },
  { type: "text" as const, label: "Text", icon: Type },
  { type: "image" as const, label: "Image", icon: Image },
  { type: "link" as const, label: "Link", icon: Link },
  { type: "button" as const, label: "Button", icon: MousePointerClick },
  { type: "input" as const, label: "Input", icon: FileText },
];

const BREAKPOINTS = [
  { key: "mobile" as const, label: "Mobile", width: 375, icon: Smartphone },
  { key: "tablet" as const, label: "Tablet", width: 768, icon: Tablet },
  { key: "desktop" as const, label: "Desktop", width: 1440, icon: Monitor },
];

export function Toolbar() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addNode = useEditorStore((s) => s.addNode);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);
  const setBreakpoint = useEditorStore((s) => s.setBreakpoint);
  const previewMode = useEditorStore((s) => s.previewMode);
  const togglePreviewMode = useEditorStore((s) => s.togglePreviewMode);
  const compile = useEditorStore((s) => s.compile);
  const download = useEditorStore((s) => s.download);
  const exportZip = useEditorStore((s) => s.exportZip);
  const loadSceneFromFile = useEditorStore((s) => s.loadSceneFromFile);
  const scene = useEditorStore((s) => s.scene);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadSceneFromFile(file);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="h-9 bg-nexus-panel border-b border-nexus-border flex items-center px-2 gap-1 shrink-0 relative select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <span className="w-3 h-3 rounded-sm bg-sky-500" />
        <span className="text-xs font-semibold tracking-wide text-nexus-text">
          NexusWeb
        </span>
      </div>

      {/* Add Node */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1.5 px-2.5 h-7 text-xxs font-medium text-nexus-text rounded hover:bg-nexus-panelHover transition-colors"
        >
          <Plus size={12} /> Node
        </button>
        {showAddMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowAddMenu(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-44 bg-nexus-panel border border-nexus-border rounded shadow-lg z-20 py-1">
              {NODE_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    addNode(type, label);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent transition-colors"
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-px h-5 bg-nexus-border mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${canUndo ? "text-nexus-muted hover:text-nexus-text hover:bg-nexus-panelHover" : "text-nexus-border cursor-not-allowed"}`}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${canRedo ? "text-nexus-muted hover:text-nexus-text hover:bg-nexus-panelHover" : "text-nexus-border cursor-not-allowed"}`}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo size={14} />
      </button>

      <div className="w-px h-5 bg-nexus-border mx-1" />

      {/* Breakpoints */}
      <div className="flex items-center bg-nexus-bg border border-nexus-border rounded overflow-hidden">
        {BREAKPOINTS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setBreakpoint(key)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xxs font-medium transition-colors ${
              activeBreakpoint === key
                ? "bg-nexus-accent text-white"
                : "text-nexus-muted hover:text-nexus-text"
            }`}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-nexus-border mx-1" />

      {/* Preview Mode */}
      <button
        onClick={togglePreviewMode}
        className={`flex items-center gap-1.5 px-2 py-1.5 text-xxs font-medium rounded transition-colors ${
          previewMode
            ? "bg-nexus-green/20 text-green-400 border border-nexus-green/30"
            : "text-nexus-muted hover:text-nexus-text hover:bg-nexus-panelHover border border-transparent"
        }`}
        title="Toggle Preview Mode"
      >
        {previewMode ? <Eye size={12} /> : <EyeOff size={12} />}
        <span className="hidden sm:inline">
          {previewMode ? "Preview" : "Design"}
        </span>
      </button>

      <div className="flex-1" />

      {/* Open */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".nexus"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 h-7 text-xxs font-medium text-nexus-text rounded hover:bg-nexus-panelHover transition-colors"
        title="Open .nexus file"
      >
        <Upload size={12} /> Open
      </button>

      {/* Download .nexus */}
      <button
        onClick={() => {
          if (scene) download(scene.name || "untitled");
        }}
        className="flex items-center gap-1.5 px-3 h-7 text-xxs font-medium text-nexus-text rounded hover:bg-nexus-panelHover transition-colors"
        title="Save (.nexus file)"
      >
        <Save size={12} /> Save
      </button>

      {/* Export compiled ZIP */}
      <button
        onClick={() => exportZip()}
        className="flex items-center gap-1.5 px-3 h-7 text-xxs font-medium text-nexus-text rounded hover:bg-nexus-panelHover transition-colors"
        title="Export compiled ZIP"
      >
        <Download size={12} /> Export
      </button>

      {/* Preview compiled output */}
      <button
        onClick={() => compile()}
        className="flex items-center gap-1.5 px-3 h-7 text-xxs font-medium text-white bg-nexus-accentHover rounded hover:bg-sky-600 transition-colors"
        title="Preview compiled output in new tab"
      >
        <Play size={12} /> Preview
      </button>
    </div>
  );
}
