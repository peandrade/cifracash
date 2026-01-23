"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, X } from "lucide-react";
import type { TransactionType } from "@/types";

interface QuickActionButtonsProps {
  onQuickAdd: (type: TransactionType) => void;
}

export function QuickActionButtons({ onQuickAdd }: QuickActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickAdd = (type: TransactionType) => {
    onQuickAdd(type);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isExpanded
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {}
        <button
          onClick={() => handleQuickAdd("income")}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium whitespace-nowrap">Nova Receita</span>
        </button>

        {}
        <button
          onClick={() => handleQuickAdd("expense")}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:scale-105"
        >
          <TrendingDown className="w-5 h-5" />
          <span className="font-medium whitespace-nowrap">Nova Despesa</span>
        </button>
      </div>

      {}
      <button
        onClick={handleToggle}
        className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isExpanded
            ? "bg-gray-700 hover:bg-gray-600 rotate-45"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/25 hover:shadow-violet-500/40"
        }`}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
