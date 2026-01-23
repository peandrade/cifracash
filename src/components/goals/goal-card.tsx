"use client";

import { Trash2, Plus, Trophy, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGoalCategoryColor, getGoalCategoryIcon, type GoalCategoryType } from "@/lib/constants";
import type { GoalWithProgress } from "@/app/api/goals/route";

interface GoalCardProps {
  goal: GoalWithProgress;
  onContribute?: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, onContribute, onDelete }: GoalCardProps) {
  const categoryColor = getGoalCategoryColor(goal.category as GoalCategoryType);
  const categoryIcon = getGoalCategoryIcon(goal.category as GoalCategoryType);
  const isCompleted = goal.isCompleted;

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className={`bg-[var(--bg-hover)] rounded-xl p-4 group transition-all ${
        isCompleted ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            {categoryIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)]">
                {goal.name}
              </span>
              {isCompleted && (
                <Trophy className="w-4 h-4 text-amber-400" />
              )}
            </div>
            {goal.description && (
              <p className="text-xs text-[var(--text-dimmed)] line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isCompleted && onContribute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContribute();
              }}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all"
              title="Adicionar valor"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-muted)]">
          {formatCurrency(goal.currentValue)}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {formatCurrency(goal.targetValue)}
        </span>
      </div>

      {}
      <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(goal.progress, 100)}%`,
            backgroundColor: isCompleted ? "#10B981" : categoryColor,
          }}
        />
      </div>

      {}
      <div className="flex items-center justify-between text-xs text-[var(--text-dimmed)]">
        <div className="flex items-center gap-3">
          <span
            className="font-medium"
            style={{ color: isCompleted ? "#10B981" : categoryColor }}
          >
            {goal.progress.toFixed(1)}%
          </span>
          {!isCompleted && goal.remaining > 0 && (
            <span>Faltam {formatCurrency(goal.remaining)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {goal.monthlyNeeded && !isCompleted && (
            <span className="flex items-center gap-1" title="Guardar por mês">
              <TrendingUp className="w-3 h-3" />
              {formatCurrency(goal.monthlyNeeded)}/mês
            </span>
          )}
          {goal.targetDate && (
            <span className="flex items-center gap-1" title="Data alvo">
              <Calendar className="w-3 h-3" />
              {formatDate(goal.targetDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
