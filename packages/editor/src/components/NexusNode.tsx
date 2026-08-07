import { memo, useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

type ResizeDirection = "se" | "e" | "s";

export interface NexusNodeData {
  label: string;
  nodeName: string;
  type: string;
  width: number;
  height: number;
  nodeStyle: React.CSSProperties;
  content: string;
  placeholder: string;
  imageSrc: string;
  alt: string;
  onResizeEnd: (w: number, h: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Resize handle – rendered inside the custom node                    */
/* ------------------------------------------------------------------ */

function ResizeHandle({
  direction,
  onResize,
  onResizeEnd,
}: {
  direction: ResizeDirection;
  onResize: (dx: number, dy: number) => void;
  onResizeEnd: () => void;
}) {
  const { getZoom } = useReactFlow();
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      draggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      const onMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return;
        const zoom = getZoom();
        const dx = (ev.clientX - lastPosRef.current.x) / zoom;
        const dy = (ev.clientY - lastPosRef.current.y) / zoom;
        lastPosRef.current = { x: ev.clientX, y: ev.clientY };
        onResize(dx, dy);
      };

      const onUp = () => {
        draggingRef.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        onResizeEnd();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [getZoom, onResize, onResizeEnd],
  );

  const posStyle: Record<ResizeDirection, React.CSSProperties> = {
    se: {
      bottom: "-6px",
      right: "-6px",
      cursor: "nwse-resize",
    },
    e: {
      top: "50%",
      right: "-6px",
      transform: "translateY(-50%)",
      cursor: "ew-resize",
    },
    s: {
      left: "50%",
      bottom: "-6px",
      transform: "translateX(-50%)",
      cursor: "ns-resize",
    },
  };

  return (
    <div
      className="absolute w-3 h-3 bg-sky-500 border border-white rounded-full z-50"
      style={{
        pointerEvents: "auto",
        touchAction: "none",
        ...posStyle[direction],
      }}
      onPointerDown={onPointerDown}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Node content renderer – shows what the node would look like        */
/* ------------------------------------------------------------------ */

function NodeContent({ data }: { data: NexusNodeData }) {
  const { type, content, placeholder, imageSrc, alt, nodeName } = data;

  switch (type) {
    case "image":
      if (imageSrc) {
        return (
          <img
            src={imageSrc}
            alt={alt || ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        );
      }
      return <span className="opacity-40">Image</span>;
    case "input":
      return <span className="opacity-60">{placeholder || "Enter text"}</span>;
    case "textarea":
      return <span className="opacity-60">{placeholder || "Enter text"}</span>;
    case "select":
      return <span className="opacity-60">{content || "Option"}</span>;
    case "button":
    case "link":
      return <span>{content || nodeName || "…"}</span>;
    case "text":
      return <span>{content || nodeName || "Text"}</span>;
    default:
      return <span className="opacity-40">{nodeName}</span>;
  }
}

/* ------------------------------------------------------------------ */
/*  Custom node rendered inside ReactFlow                             */
/* ------------------------------------------------------------------ */

interface NexusNodeProps {
  data: NexusNodeData;
  selected: boolean;
}

function NexusNodeComponent({ data, selected }: NexusNodeProps) {
  const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  // Use in-flight drag size when resizing, otherwise committed store size
  const displayW = dragSize?.w ?? data.width;
  const displayH = dragSize?.h ?? data.height;

  const handleResize = useCallback(
    (dx: number, dy: number) => {
      setDragSize((prev) => {
        const base = prev ?? { w: data.width, h: data.height };
        return {
          w: Math.max(40, base.w + dx),
          h: Math.max(20, base.h + dy),
        };
      });
    },
    [data.width, data.height],
  );

  const handleResizeEnd = useCallback(() => {
    if (dragSize) {
      data.onResizeEnd(dragSize.w, dragSize.h);
      setDragSize(null);
    }
  }, [dragSize, data]);

  // Inner styled box — pad/background/border/flex from the node's CSS.
  // Margin is intentionally NOT applied here: the outer ReactFlow wrapper
  // already controls the node's position, so a margin would shift the visual
  // box away from the drag position and make styled nodes stick at the top-left.
  const innerStyle: React.CSSProperties = {
    ...data.nodeStyle,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    margin: 0,
  };

  // For text and inline nodes, keep content left-aligned.
  const isInline = data.type === "text" || data.type === "link";
  if (isInline) {
    innerStyle.alignItems = data.nodeStyle.alignItems ?? "center";
    innerStyle.justifyContent = data.nodeStyle.justifyContent ?? "flex-start";
  }

  return (
    // Outer wrapper controls ReactFlow position/drag. Free of margin & transform
    // so the drop position always matches where the node renders.
    <div
      style={{
        width: `${displayW}px`,
        height: `${displayH}px`,
        position: "relative",
        overflow: "visible",
      }}
    >
      <div style={innerStyle}>
        <NodeContent data={data} />
      </div>

      {/* Node name badge */}
      <span
        className="absolute pointer-events-none rounded px-1 text-xxs"
        style={{
          top: "-8px",
          left: "-1px",
          background: selected ? "#0ea5e9" : "rgba(0,0,0,0.6)",
          color: "#fff",
          fontSize: 9,
          lineHeight: "12px",
          zIndex: 60,
          whiteSpace: "nowrap",
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data.nodeName}
      </span>

      {selected && (
        <>
          <ResizeHandle
            direction="e"
            onResize={(dx) => handleResize(dx, 0)}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            direction="s"
            onResize={(_dx, dy) => handleResize(0, dy)}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            direction="se"
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
          />
        </>
      )}
    </div>
  );
}

export const MemoizedNexusNode = memo(NexusNodeComponent);
