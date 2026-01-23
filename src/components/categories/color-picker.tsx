"use client";

import { Check } from "lucide-react";

const COLORS = [
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#22C55E",
  "#84CC16",
  "#EAB308",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#D946EF",
  "#A855F7",
  "#64748B",
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
