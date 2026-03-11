"use client";

import { useId, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import {
  AreaChart,
  Area,
  Grid,
  XAxis,
  ChartTooltip,
} from "@/components/ui/area-chart";

const HIDDEN = "•••••";
import type { MonthlyEvolution, EvolutionPeriod } from "@/types";

interface MonthlyChartProps {
  data: MonthlyEvolution[];
  period: EvolutionPeriod;
  onPeriodChange: (period: EvolutionPeriod) => void;
}

const PERIOD_KEYS: { value: EvolutionPeriod; key: string }[] = [
  { value: "1w", key: "1w" },
  { value: "1m", key: "1m" },
  { value: "3m", key: "3m" },
  { value: "6m", key: "6m" },
  { value: "1y", key: "1y" },
];

export function MonthlyChart({ data, period, onPeriodChange }: MonthlyChartProps) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("periods");
  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();
  const descriptionId = useId();
  const PERIOD_OPTIONS = PERIOD_KEYS.map(p => ({ value: p.value, label: tp(p.key) }));
  const currentPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || tp("6m");

  // Calculate totals for accessibility description
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

  // Transform data for the new chart format - add date property
  const chartData = useMemo(() => {
    return data.map((d, index) => ({
      ...d,
      date: new Date(Date.now() - (data.length - 1 - index) * 24 * 60 * 60 * 1000),
    }));
  }, [data]);

  return (
    <div
      className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {t("financialEvolution")}
        </h3>
        <div className="relative flex-shrink-0">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as EvolutionPeriod)}
            className="appearance-none select-icon-manual cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)"
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>
      <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: "var(--text-dimmed)" }}>
        {t("incomeVsExpenses")}
      </p>
      <p id={descriptionId} className="sr-only">
        {t("chartDescription")} {currentPeriodLabel.toLowerCase()}.
        {privacy.hideValues ? ` ${t("valuesHidden")}.` : ` ${t("totalIncome")} ${formatCurrency(totalIncome)}. ${t("totalExpenses")} ${formatCurrency(totalExpense)}.`}
      </p>
      <div className="h-48 sm:h-64" role="img" aria-describedby={descriptionId}>
        {chartData.length > 0 ? (
          <AreaChart
            data={chartData}
            xDataKey="date"
            margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
            aspectRatio="auto"
            className="h-full"
          >
            <Grid horizontal strokeDasharray="3,3" />
            <Area
              dataKey="income"
              fill="#10B981"
              fillOpacity={0.3}
              stroke="#10B981"
              strokeWidth={2}
              fadeEdges
            />
            <Area
              dataKey="expense"
              fill="#6366F1"
              fillOpacity={0.3}
              stroke="#6366F1"
              strokeWidth={2}
              fadeEdges
            />
            <XAxis numTicks={5} />
            <ChartTooltip
              showDatePill
              rows={(point) => [
                {
                  color: "#10B981",
                  label: t("income"),
                  value: privacy.hideValues ? HIDDEN : formatCurrency(point.income as number),
                },
                {
                  color: "#6366F1",
                  label: t("expenses"),
                  value: privacy.hideValues ? HIDDEN : formatCurrency(point.expense as number),
                },
              ]}
            />
          </AreaChart>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>
              {t("noDataToShow")}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
          <span className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("income")}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500" />
          <span className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("expenses")}</span>
        </div>
      </div>
    </div>
  );
}
