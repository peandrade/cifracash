"use client";

import { Trash2, Plus, Trophy, Calendar, TrendingUp, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGoalCategoryColor, getGoalCategoryIcon, type GoalCategoryType } from "@/lib/constants";
import type { GoalWithProgress } from "@/app/api/goals/route";

interface GoalCardProps {
  goal: GoalWithProgress;
  onContribute?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, onContribute, onEdit, onDelete }: GoalCardProps) {
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
      className={`bg-[var(--bg-hover)] rounded-lg sm:rounded-xl p-3 sm:p-4 group transition-all ${
        isCompleted ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            {categoryIcon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                {goal.name}
              </span>
              {isCompleted && (
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              )}
            </div>
            {goal.description && (
              <p className="text-[10px] sm:text-xs text-[var(--text-dimmed)] line-clamp-1">
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
              className="p-2 sm:p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 rounded-lg transition-all"
              title="Adicionar valor"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 sm:p-1.5 hover:bg-primary-soft active:bg-primary-medium rounded-lg transition-all"
              title="Editar"
            >
              <Pencil className="w-4 h-4 text-primary-color" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 sm:p-1.5 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-all"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-xs sm:text-sm text-[var(--text-muted)]">
          {formatCurrency(goal.currentValue)}
        </span>
        <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
          {formatCurrency(goal.targetValue)}
        </span>
      </div>

      {}
      <div className="h-1.5 sm:h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden mb-1.5 sm:mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(goal.progress, 100)}%`,
            backgroundColor: isCompleted ? "#10B981" : categoryColor,
          }}
        />
      </div>

      {}
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--text-dimmed)]">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span
            className="font-medium"
            style={{ color: isCompleted ? "#10B981" : categoryColor }}
          >
            {goal.progress.toFixed(1)}%
          </span>
          {!isCompleted && goal.remaining > 0 && (
            <span className="hidden sm:inline">Faltam {formatCurrency(goal.remaining)}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {goal.monthlyNeeded && !isCompleted && (
            <span className="hidden sm:flex items-center gap-1" title="Guardar por mês">
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
