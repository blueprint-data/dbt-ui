"use client";

import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 240;

function clampWidth(px: number): number {
  if (typeof window === "undefined") return px;
  const max = Math.max(MIN_WIDTH + 80, Math.floor(window.innerWidth * 0.6));
  return Math.min(Math.max(MIN_WIDTH, px), max);
}

interface SidebarResizeHandleProps {
  width: number;
  onWidthChange: (next: number) => void;
  /** Called once when the drag ends (or on double-click reset) — use for persistence. */
  onResizeCommit?: (width: number) => void;
  /** Notifies parent so layout can disable CSS transitions during drag. */
  onDragActiveChange?: (active: boolean) => void;
  className?: string;
}

export function SidebarResizeHandle({
  width,
  onWidthChange,
  onResizeCommit,
  onDragActiveChange,
  className,
}: SidebarResizeHandleProps) {
  const { open, isMobile } = useSidebar();
  const draggingRef = React.useRef(false);
  const startRef = React.useRef({ x: 0, w: 0 });
  const latestRef = React.useRef(width);
  const rafRef = React.useRef<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    latestRef.current = width;
  }, [width]);

  React.useEffect(() => {
    if (!isDragging) return;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isDragging]);

  if (isMobile || !open) {
    return null;
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    onDragActiveChange?.(true);
    startRef.current = { x: e.clientX, w: width };
    latestRef.current = width;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startRef.current.x;
    const next = clampWidth(startRef.current.w + delta);
    latestRef.current = next;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        onWidthChange(latestRef.current);
      });
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    onDragActiveChange?.(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onWidthChange(latestRef.current);
    onResizeCommit?.(latestRef.current);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = DEFAULT_WIDTH;
    latestRef.current = next;
    onDragActiveChange?.(true);
    onWidthChange(next);
    onResizeCommit?.(next);
    requestAnimationFrame(() => onDragActiveChange?.(false));
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize navigation panel"
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute inset-y-0 right-0 z-30 hidden w-3 translate-x-1/2 cursor-col-resize lg:block",
        "touch-none select-none",
        isDragging ? "bg-[var(--brand-primary-500)]/15" : "hover:bg-[var(--semantic-border-subtle)]/40",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2",
          isDragging
            ? "bg-[var(--brand-primary-500)]"
            : "bg-[var(--semantic-border-subtle)] opacity-70"
        )}
        aria-hidden
      />
    </div>
  );
}

export { DEFAULT_WIDTH as SIDEBAR_DEFAULT_WIDTH };
