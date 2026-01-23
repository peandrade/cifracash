"use client";

import { Check } from "lucide-react";

// Paleta de cores predefinidas
const COLORS = [
  "#8B5CF6", // Violet
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#10B981", // Emerald
  "#22C55E", // Green
  "#84CC16", // Lime
  "#EAB308", // Yellow
  "#F59E0B", // Amber
  "#F97316", // Orange
  "#EF4444", // Red
  "#EC4899", // Pink
  "#D946EF", // Fuchsia
  "#A855F7", // Purple
  "#64748B", // Slate
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
        >
          {value === color && <Check className="w-4 h-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
