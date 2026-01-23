"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, RefreshCw, Trophy, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGoalCategoryLabel, getGoalCategoryColor, getGoalCategoryIcon, type GoalCategoryType } from "@/lib/constants";
import { GoalModal } from "./goal-modal";
import { GoalCard } from "./goal-card";
import { ContributeModal } from "./contribute-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GoalWithProgress } from "@/app/api/goals/route";

interface GoalData {
  goals: GoalWithProgress[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    totalTargetValue: number;
    totalCurrentValue: number;
    overallProgress: number;
  };
}

interface GoalSectionProps {
  onGoalUpdated?: () => void;
}

export function GoalSection({ onGoalUpdated }: GoalSectionProps) {
  const [data, setData] = useState<GoalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const goalData = await response.json();
        setData(goalData);
      }
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSave = async (goalData: {
    name: string;
    description?: string;
    category: GoalCategoryType;
    targetValue: number;
    currentValue?: number;
    targetDate?: string;
    color?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        await fetchGoals();
        setIsModalOpen(false);
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGoalId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals/${deleteGoalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchGoals();
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
    } finally {
      setIsDeleting(false);
      setDeleteGoalId(null);
    }
  };

  const handleContribute = async (value: number, notes?: string) => {
    if (!contributeGoalId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${contributeGoalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, notes }),
      });

      if (response.ok) {
        await fetchGoals();
        setContributeGoalId(null);
        onGoalUpdated?.();
      }
    } catch (error) {
      console.error("Erro ao contribuir:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalGoals: 0,
    completedGoals: 0,
    totalTargetValue: 0,
    totalCurrentValue: 0,
    overallProgress: 0,
  };

  const activeGoals = data?.goals.filter((g) => !g.isCompleted) || [];
  const completedGoals = data?.goals.filter((g) => g.isCompleted) || [];
  const contributeGoal = data?.goals.find((g) => g.id === contributeGoalId);

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Target className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Metas Financeiras
                </h3>
                <p className="text-sm text-[var(--text-dimmed)]">
                  {summary.totalGoals > 0
                    ? `${summary.completedGoals}/${summary.totalGoals} concluídas`
                    : "Defina seus objetivos"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/25 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nova
            </button>
          </div>

          {}
          {data && data.goals.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Guardado</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(summary.totalCurrentValue)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Objetivo Total</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {formatCurrency(summary.totalTargetValue)}
                </p>
              </div>
            </div>
          )}

          {}
          {data && data.goals.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--text-dimmed)]">Progresso geral</span>
                <span className="text-violet-400 font-medium">
                  {summary.overallProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(summary.overallProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {}
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {data?.goals.length === 0 ? (
            <div className="text-center py-6">
              <Target className="w-10 h-10 text-[var(--text-dimmed)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)]">Nenhuma meta criada</p>
              <p className="text-xs text-[var(--text-dimmed)]">
                Defina seus objetivos financeiros
              </p>
            </div>
          ) : (
            <>
              {}
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-violet-400 uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Em progresso ({activeGoals.length})
                  </span>
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onContribute={() => setContributeGoalId(goal.id)}
                      onDelete={() => setDeleteGoalId(goal.id)}
                    />
                  ))}
                </div>
              )}

              {}
              {completedGoals.length > 0 && (
                <div className="space-y-2 mt-4">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Concluídas ({completedGoals.length})
                  </span>
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onDelete={() => setDeleteGoalId(goal.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      {contributeGoal && (
        <ContributeModal
          isOpen={!!contributeGoalId}
          onClose={() => setContributeGoalId(null)}
          onSave={handleContribute}
          isSubmitting={isSubmitting}
          goalName={contributeGoal.name}
          remaining={contributeGoal.remaining}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={handleDelete}
        title="Remover Meta"
        message="Tem certeza que deseja remover esta meta? Todo o histórico de contribuições será perdido."
        confirmText="Remover"
        isLoading={isDeleting}
      />
    </>
  );
}
