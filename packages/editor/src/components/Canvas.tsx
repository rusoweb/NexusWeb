import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  MousePointer2,
  Grid3X3,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "../store.ts";
import { flattenTree } from "@nexusweb/core";
import { MemoizedNexusNode } from "./NexusNode.tsx";

const BREAKPOINT_WIDTHS = { mobile: 375, tablet: 768, desktop: 1440 };

type BreakpointKey = keyof typeof BREAKPOINT_WIDTHS;

function resolveDimension(
  value: string | undefined,
  activeBreakpoint: BreakpointKey,
  fallback: number,
): number {
  if (!value) return fallback;
  if (value.endsWith("%")) {
    return (BREAKPOINT_WIDTHS[activeBreakpoint] * parseFloat(value)) / 100;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getNodeWorldPosition(
  nodeId: string,
  nodes: Record<string, import("@nexusweb/core").NexusNode>,
  activeBreakpoint: BreakpointKey,
): { x: number; y: number } {
  const node = nodes[nodeId];
  if (!node) return { x: 0, y: 0 };

  const localX = resolveDimension(node.transform.x, activeBreakpoint, 0);
  const localY = resolveDimension(node.transform.y, activeBreakpoint, 0);
  const parent = node.parentId ? nodes[node.parentId] : null;

  if (!parent) {
    return { x: localX, y: localY };
  }

  const parentWorld = getNodeWorldPosition(parent.id, nodes, activeBreakpoint);
  return { x: parentWorld.x + localX, y: parentWorld.y + localY };
}

function renderSpacingValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const s = value as Record<string, string>;
    return `${s.top ?? 0} ${s.right ?? 0} ${s.bottom ?? 0} ${s.left ?? 0}`;
  }
  return "";
}

function nexusStyleToCss(
  nexusNode: import("@nexusweb/core").NexusNode,
): React.CSSProperties {
  const s = nexusNode.style;
  const css: React.CSSProperties = {};

  if (s.backgroundColor) css.background = s.backgroundColor;
  if ((s as any).backgroundImage)
    css.backgroundImage = (s as any).backgroundImage;
  if ((s as any).backgroundSize) css.backgroundSize = (s as any).backgroundSize;
  if ((s as any).backgroundRepeat)
    css.backgroundRepeat = (s as any).backgroundRepeat;
  if ((s as any).backgroundPosition)
    css.backgroundPosition = (s as any).backgroundPosition;
  if (s.color) css.color = s.color;
  if (s.fontFamily) css.fontFamily = s.fontFamily;
  if (s.fontSize) css.fontSize = s.fontSize;
  if (s.fontWeight !== undefined) css.fontWeight = s.fontWeight;
  if (s.lineHeight !== undefined) css.lineHeight = s.lineHeight;
  if ((s as any).letterSpacing) css.letterSpacing = (s as any).letterSpacing;
  if ((s as any).textTransform) css.textTransform = (s as any).textTransform;
  if (s.textAlign) css.textAlign = s.textAlign;
  if (s.borderRadius) css.borderRadius = s.borderRadius;
  if (s.borderWidth) {
    css.border = `${s.borderWidth} ${s.borderStyle ?? "solid"} ${
      s.borderColor ?? "transparent"
    }`;
  }
  if (s.borderStyle) css.borderStyle = s.borderStyle;
  if (s.borderColor) css.borderColor = s.borderColor;
  if (s.opacity !== undefined) css.opacity = s.opacity;
  if (s.display) css.display = s.display;
  if (s.flexDirection) css.flexDirection = s.flexDirection;
  if (s.justifyContent) css.justifyContent = s.justifyContent;
  if (s.alignItems) css.alignItems = s.alignItems;
  if (s.gap) css.gap = s.gap;
  if (s.overflow) css.overflow = s.overflow;
  if (s.boxShadow) css.boxShadow = s.boxShadow;
  if (s.cursor) css.cursor = s.cursor;
  if (s.padding) css.padding = renderSpacingValue(s.padding);
  if (s.margin) css.margin = renderSpacingValue(s.margin);
  if (s.maxWidth) css.maxWidth = s.maxWidth;
  if (s.minWidth) css.minWidth = s.minWidth;
  if (s.maxHeight) css.maxHeight = s.maxHeight;
  if (s.minHeight) css.minHeight = s.minHeight;
  if (s.textDecoration) css.textDecoration = s.textDecoration;
  if (s.transition) css.transition = s.transition;
  if ((s as any).objectFit) css.objectFit = (s as any).objectFit;
  if (s.aspectRatio) css.aspectRatio = s.aspectRatio;

  return css;
}

function getNodeContent(nexusNode: import("@nexusweb/core").NexusNode): string {
  const d = nexusNode.data;
  switch (nexusNode.type) {
    case "text":
      return (d.content as string) ?? "";
    case "button":
    case "link":
      return (d.text as string) ?? "";
    case "input":
    case "textarea":
    case "select":
      return (d.placeholder as string) ?? "";
    default:
      return "";
  }
}

function nodeToFlowNode(
  nexusNode: import("@nexusweb/core").NexusNode,
  nodes: Record<string, import("@nexusweb/core").NexusNode>,
  activeBreakpoint: BreakpointKey,
  onResizeEnd: (id: string, w: number, h: number) => void,
): Node {
  const world = getNodeWorldPosition(nexusNode.id, nodes, activeBreakpoint);
  const resolvedX = world.x;
  const resolvedY = world.y;
  const isRoot = !nexusNode.parentId;
  const w = nexusNode.parentId
    ? resolveDimension(nexusNode.transform.width, activeBreakpoint, 10)
    : BREAKPOINT_WIDTHS[activeBreakpoint];
  const h = resolveDimension(nexusNode.transform.height, activeBreakpoint, 10);

  const isRootPage = isRoot && nexusNode.type === "page";

  const nodeStyle: React.CSSProperties = {
    ...nexusStyleToCss(nexusNode),
    // Root page node renders as a white "web page" with a black outline.
    // Other nodes keep their own styling with a subtle dark border.
    background: isRootPage
      ? (nexusNode.style.backgroundColor ?? "#ffffff")
      : (nexusNode.style.backgroundColor ?? "#252526"),
    border: isRootPage
      ? "1px solid #000000"
      : nexusNode.style.borderWidth
        ? `${nexusNode.style.borderWidth} ${nexusNode.style.borderStyle ?? "solid"} ${nexusNode.style.borderColor ?? "#3e3e42"}`
        : "1px solid #3e3e42",
    color: isRootPage
      ? (nexusNode.style.color ?? "#1a1a1a")
      : (nexusNode.style.color ?? "#cccccc"),
    fontSize: nexusNode.style.fontSize ?? "14px",
    padding: nexusNode.style.padding
      ? renderSpacingValue(nexusNode.style.padding)
      : "8px 12px",
    borderRadius: nexusNode.style.borderRadius ?? "0px",
    opacity: nexusNode.style.opacity ?? 1,
    cursor: "default",
    boxSizing: "border-box",
  };

  const nodeId = nexusNode.id;

  return {
    id: nodeId,
    type: "nexusNode",
    position: { x: resolvedX, y: resolvedY },
    data: {
      label: nexusNode.name,
      type: nexusNode.type,
      width: w,
      height: h,
      nodeStyle,
      content: getNodeContent(nexusNode),
      isRoot: isRoot,
      onResizeEnd: (nw: number, nh: number) => onResizeEnd(nodeId, nw, nh),
    } as unknown as Record<string, unknown>,
    style: {
      width: `${w}px`,
      height: `${h}px`,
    },
  };
}

/* ---- Custom node type registration ---- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes = { nexusNode: MemoizedNexusNode as any };

/* ---- Viewport toolbar (must live inside ReactFlowProvider) ---- */
function ViewportToolbar({
  breakpointLabel,
  previewMode,
  snapToGrid,
  onToggleSnap,
}: {
  breakpointLabel: string;
  previewMode: boolean;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="h-8 bg-nexus-panel border-b border-nexus-border flex items-center px-2 gap-1 shrink-0 select-none">
      <div className="flex items-center gap-1 mr-2">
        <MousePointer2 size={12} className="text-nexus-muted" />
        <span className="text-xxs text-nexus-muted">{breakpointLabel}</span>
      </div>

      <div className="w-px h-4 bg-nexus-border mx-1" />

      <button className="g-btn-icon" title="Zoom in" onClick={() => zoomIn()}>
        <ZoomIn size={13} />
      </button>
      <button className="g-btn-icon" title="Zoom out" onClick={() => zoomOut()}>
        <ZoomOut size={13} />
      </button>
      <button
        className="g-btn-icon"
        title="Fit to view"
        onClick={() => fitView()}
      >
        <Maximize size={13} />
      </button>

      <div className="w-px h-4 bg-nexus-border mx-1" />

      <button
        className={`g-btn-icon ${snapToGrid ? "text-nexus-text bg-nexus-panelHover" : ""}`}
        title="Snap to grid (8px)"
        onClick={onToggleSnap}
      >
        <Grid3X3 size={13} />
      </button>

      <div className="flex-1" />

      {!previewMode && (
        <span className="text-xxs text-nexus-muted">
          Drag to move · Resize handles to scale
        </span>
      )}
    </div>
  );
}

export function Canvas() {
  const scene = useEditorStore((s) => s.scene);
  const selectedId = useEditorStore((s) => s.selectedNodeId);
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);
  const previewMode = useEditorStore((s) => s.previewMode);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodePosition = useEditorStore((s) => s.updateNodePosition);
  const updateNodeSize = useEditorStore((s) => s.updateNodeSize);
  const deleteNode = useEditorStore((s) => s.deleteNode);

  const [snapToGrid, setSnapToGrid] = useState(true);

  const canvasWidth = BREAKPOINT_WIDTHS[activeBreakpoint];

  /* Callback provided to the custom node so it can commit the final size */
  const handleResizeEnd = useCallback(
    (id: string, w: number, h: number) => {
      updateNodeSize(id, w, h);
    },
    [updateNodeSize],
  );

  const flowNodes = useMemo(() => {
    if (!scene) return [];
    const all = flattenTree(scene.rootId, scene.nodes);
    return all.map((node) =>
      nodeToFlowNode(node, scene.nodes, activeBreakpoint, handleResizeEnd),
    );
  }, [scene, activeBreakpoint, handleResizeEnd]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, , onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!scene) return;
    setNodes(
      flowNodes.map((node) => ({
        ...node,
        selected: node.id === selectedId,
      })),
    );
  }, [flowNodes, selectedId, scene, setNodes]);

  const reactFlowKey = useMemo(
    // Only remount ReactFlow when switching to a completely different scene,
    // not on every style/content/position update (prevents viewport resets).
    () => (scene ? scene.id : "empty"),
    [scene],
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateNodePosition],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement;
      const ignoreKeys = ["INPUT", "TEXTAREA", "SELECT"];
      if (
        target &&
        (ignoreKeys.includes(target.tagName) ||
          (target instanceof HTMLElement && target.isContentEditable))
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = useEditorStore.getState().selectedNodeId;
        if (sel) deleteNode(sel);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode]);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nexus-bg text-nexus-muted text-sm">
        Loading scene...
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex-1 bg-nexus-bg flex flex-col">
        {/* Godot-style viewport toolbar */}
        <ViewportToolbar
          breakpointLabel={`${activeBreakpoint} · ${canvasWidth}px`}
          previewMode={previewMode}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setSnapToGrid((s) => !s)}
        />

        {/* Canvas viewport — fills remaining height, centered content */}
        <div className="flex-1 flex flex-col items-center overflow-auto">
          {/* Breakpoint label */}
          {!previewMode && (
            <div className="mt-2 px-2 py-0.5 bg-nexus-panel border border-nexus-border rounded text-xxs text-nexus-muted z-10">
              {activeBreakpoint} — {canvasWidth}px
            </div>
          )}
          {/* Breakpoint-width frame — the dark editor surface around the page */}
          <div
            className="relative border-x border-nexus-border flex-1 w-full"
            style={{
              maxWidth: `${canvasWidth}px`,
              minHeight: "400px",
            }}
          >
            <ReactFlow
              key={reactFlowKey}
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDragStop={onNodeDragStop}
              onPaneClick={onPaneClick}
              fitView
              snapToGrid={snapToGrid}
              snapGrid={[8, 8]}
              colorMode="dark"
              deleteKeyCode={null}
              nodesDraggable={!previewMode}
              nodesConnectable={false}
              elementsSelectable={!previewMode}
              style={{ background: "transparent" }}
            >
              {!previewMode && (
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  color="#3c3c3c"
                />
              )}
              <Controls
                style={{
                  backgroundColor: "#252526",
                  color: "#ccc",
                  borderColor: "#3e3e42",
                }}
              />
              <MiniMap
                style={{ backgroundColor: "#252526" }}
                nodeColor={() => "#61afef"}
                maskColor="rgba(30, 30, 30, 0.7)"
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
