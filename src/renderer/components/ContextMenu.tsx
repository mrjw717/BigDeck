import React, { useEffect, useRef } from "react";
import {
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  CopyPlus,
  Trash,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onClear: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  canPaste: boolean;
}

export function ContextMenu({
  x,
  y,
  onCopy,
  onPaste,
  onCut,
  onClear,
  onDuplicate,
  onClose,
  canPaste,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover/90 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-1.5 w-48 animate-in fade-in zoom-in-95 duration-150"
      style={{ left: x, top: y }}
    >
      <div className="space-y-0.5">
        <MenuButton
          icon={<Copy size={14} />}
          label="Copy"
          shortcut="Ctrl+C"
          onClick={onCopy}
        />
        <MenuButton
          icon={<Clipboard size={14} />}
          label="Paste"
          shortcut="Ctrl+V"
          onClick={onPaste}
          disabled={!canPaste}
        />
        <MenuButton
          icon={<Scissors size={14} />}
          label="Cut"
          shortcut="Ctrl+X"
          onClick={onCut}
        />
        <div className="h-px bg-border my-1 mx-1" />
        <MenuButton
          icon={<CopyPlus size={14} />}
          label="Duplicate"
          onClick={onDuplicate}
        />
        <div className="h-px bg-border my-1 mx-1" />
        <MenuButton
          icon={<Trash2 size={14} />}
          label="Clear Key"
          shortcut="Del"
          onClick={onClear}
          className="text-destructive hover:bg-destructive/10"
        />
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
        disabled
          ? "opacity-30 cursor-not-allowed"
          : "hover:bg-accent text-foreground/80 hover:text-foreground"
      } ${className}`}
    >
      <span className="opacity-70 group-hover:opacity-100">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-[9px] font-black opacity-30 tracking-tight">
          {shortcut}
        </span>
      )}
    </button>
  );
}
