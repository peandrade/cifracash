"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { useTransactionStore } from "@/store/transaction-store";
import { useTemplateStore } from "@/store/template-store";
import { getMonthYearLabel } from "@/lib/constants";
import { SummaryCards, MonthlyChart, CategoryChart, TransactionList, WealthEvolutionChart, QuickStats } from "@/components/dashboard";
import { TransactionModal } from "@/components/forms/transaction-modal";
import { BudgetSection } from "@/components/budget/budget-section";
import { RecurringSection } from "@/components/recurring";
import { QuickActionButtons, TemplateSection, TemplateModal } from "@/components/quick-transaction";
import type { CreateTransactionInput, EvolutionPeriod, TransactionType, TransactionTemplate } from "@/types";

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>("6m");
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TransactionTemplate | null>(null);
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);

  const {
    transactions,
    isLoading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    getSummary,
    getCategoryData,
    getMonthlyEvolution,
  } = useTransactionStore();

  const { addTemplate, updateTemplate } = useTemplateStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const summary = getSummary();
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyEvolution(evolutionPeriod);

  const handleAddTransaction = async (
    data: CreateTransactionInput,
    saveAsTemplate?: { name: string }
  ) => {
    setIsSubmitting(true);
    try {
      await addTransaction(data);

      setBudgetRefreshTrigger((prev) => prev + 1);

      if (saveAsTemplate) {
        await addTemplate({
          name: saveAsTemplate.name,
          description: data.description,
          category: data.category,
          type: data.type,
          value: data.value,
        });
      }

      setSelectedTemplate(null);
      setInitialTransactionType(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (type: TransactionType) => {
    setInitialTransactionType(type);
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleUseTemplate = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setInitialTransactionType(undefined);
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: TransactionTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (data: {
    name: string;
    description?: string;
    category: string;
    type: TransactionType;
    value?: number;
  }) => {
    setIsTemplateSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
      } else {
        await addTemplate(data);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleCloseTransactionModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setInitialTransactionType(undefined);
  };

  const handleDeleteTransaction = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);

      setBudgetRefreshTrigger((prev) => prev + 1);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>Carregando transações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h1>
            <p className="mt-1 flex items-center gap-2" style={{ color: "var(--text-dimmed)" }}>
              <Calendar className="w-4 h-4" />
              {getMonthYearLabel()}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setInitialTransactionType(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-white"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </header>

        {}
        <QuickStats />

        {}
        <SummaryCards summary={summary} />

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <MonthlyChart
              data={monthlyData}
              period={evolutionPeriod}
              onPeriodChange={setEvolutionPeriod}
            />
          </div>
          <div>
            <CategoryChart data={categoryData} />
          </div>
        </div>

        {}
        <div className="mb-8">
          <WealthEvolutionChart />
        </div>

        {}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-1/3 space-y-6">
            {}
            <TemplateSection
              onUseTemplate={handleUseTemplate}
              onEditTemplate={handleEditTemplate}
              onCreateTemplate={handleCreateTemplate}
            />
            <BudgetSection refreshTrigger={budgetRefreshTrigger} />
            <RecurringSection
              onExpenseLaunched={() => {
                fetchTransactions();
                setBudgetRefreshTrigger((prev) => prev + 1);
              }}
            />
          </div>
          <div className="lg:w-2/3 relative">
            <div className="lg:absolute lg:inset-0">
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                deletingId={deletingId}
              />
            </div>
          </div>
        </div>
      </div>

      {}
      <QuickActionButtons onQuickAdd={handleQuickAdd} />

      {}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleAddTransaction}
        isSubmitting={isSubmitting}
        initialType={initialTransactionType}
        template={selectedTemplate}
      />

      {}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
        isSubmitting={isTemplateSubmitting}
      />
    </div>
  );
}