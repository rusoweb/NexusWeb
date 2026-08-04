import { memo, useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

type ResizeDirection = "se" | "e" | "s";

export interface NexusNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  nodeStyle: React.CSSProperties;
  content?: string;
  isRoot?: boolean;
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

  const containerStyle: React.CSSProperties = {
    ...data.nodeStyle,
    width: `${displayW}px`,
    height: `${displayH}px`,
    position: "relative",
    boxSizing: "border-box",
    overflow: "visible",
  };

  // Render the actual content for content-capable nodes
  const renderContent = () => {
    if (data.content) {
      return <span className="nexus-node-content">{data.content}</span>;
    }
    // For containers with no content, just show the label
    return (
      <span className="text-xxs opacity-40 pointer-events-none select-none">
        {data.label}
      </span>
    );
  };

  return (
    <div style={containerStyle} className="nexus-editor-node">
      {/* Lighter overlay with node name as a badge */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-1 py-0.5 pointer-events-none z-10">
        {!data.isRoot && (
          <span className="text-[9px] text-white/40 bg-black/30 rounded px-1 leading-none">
            {data.label}
          </span>
        )}
      </div>
      {/* Content area */}
      <div className="flex-1 flex items-center w-full h-full overflow-hidden">
        {renderContent()}
      </div>
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
