"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Wallet, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import { useWealthEvolution } from "@/hooks";
import { SetupPinModal, VerifyPinModal } from "@/components/privacy";
import type { WealthDataPoint } from "@/hooks";
import type { EvolutionPeriod } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  Grid,
  XAxis,
  ChartTooltip,
  type TooltipRow,
} from "@/components/ui/area-chart";

const HIDDEN = "•••••";

// Helper function to map defaultPeriod to EvolutionPeriod
function mapDefaultPeriodToWealth(defaultPeriod: string): EvolutionPeriod {
  const periodMap: Record<string, EvolutionPeriod> = {
    week: "1w",
    month: "1m",
    quarter: "3m",
    year: "1y",
  };
  return periodMap[defaultPeriod] || "1y";
}

const PERIOD_KEYS: { value: EvolutionPeriod; key: string }[] = [
  { value: "1w", key: "1w" },
  { value: "1m", key: "1m" },
  { value: "3m", key: "3m" },
  { value: "6m", key: "6m" },
  { value: "1y", key: "1y" },
];

interface WealthEvolutionChartProps {
  refreshTrigger?: number;
}

export function WealthEvolutionChart({ refreshTrigger = 0 }: WealthEvolutionChartProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tp = useTranslations("periods");
  const { formatCurrency } = useCurrency();
  const { general, privacy, toggleHideValues, setSessionUnlocked, updatePrivacy, refreshPinStatus } = usePreferences();
  const descriptionId = useId();
  const PERIOD_OPTIONS = PERIOD_KEYS.map(p => ({ value: p.value, label: tp(p.key) }));
  const [period, setPeriod] = useState<EvolutionPeriod>(() =>
    mapDefaultPeriodToWealth(general.defaultPeriod)
  );
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [showVerifyPinModal, setShowVerifyPinModal] = useState(false);

  const { data, isLoading, refresh } = useWealthEvolution(period, [refreshTrigger]);

  const handleToggleVisibility = () => {
    const result = toggleHideValues();
    if (result.needsSetupPin) {
      setShowSetupPinModal(true);
    } else if (result.needsPin) {
      setShowVerifyPinModal(true);
    }
  };

  const handlePinSetupSuccess = async () => {
    await refreshPinStatus();
    updatePrivacy({ hideValues: true });
    setShowSetupPinModal(false);
  };

  const handlePinVerified = () => {
    setSessionUnlocked(true);
    updatePrivacy({ hideValues: false });
    setShowVerifyPinModal(false);
  };

  // Update period when defaultPeriod preference changes
  useEffect(() => {
    setPeriod(mapDefaultPeriodToWealth(general.defaultPeriod));
  }, [general.defaultPeriod]);

  const summary = data?.summary || {
    currentWealth: 0,
    transactionBalance: 0,
    investmentValue: 0,
    goalsSaved: 0,
    cardDebt: 0,
    wealthChange: 0,
    wealthChangePercent: 0,
  };

  const isPositiveChange = summary.wealthChange >= 0;

  // Transform data for the new chart format - add date property
  const chartData = useMemo(() => {
    if (!data?.evolution) return [];
    return data.evolution.map((d: WealthDataPoint, index: number) => ({
      ...d,
      date: new Date(Date.now() - (data.evolution.length - 1 - index) * 24 * 60 * 60 * 1000),
    }));
  }, [data?.evolution]);

  const tooltipRowsGenerator = (point: Record<string, unknown>): TooltipRow[] => {
    const rows: TooltipRow[] = [
      {
        color: "#8B5CF6",
        label: t("patrimony").replace(":", ""),
        value: privacy.hideValues ? HIDDEN : formatCurrency(point.totalWealth as number),
      },
      {
        color: "#10B981",
        label: t("balance"),
        value: privacy.hideValues ? HIDDEN : formatCurrency(point.transactionBalance as number),
      },
      {
        color: "#3B82F6",
        label: t("invested"),
        value: privacy.hideValues ? HIDDEN : formatCurrency(point.investmentValue as number),
      },
    ];

    if ((point.goalsSaved as number) > 0) {
      rows.push({
        color: "#F59E0B",
        label: t("goals"),
        value: privacy.hideValues ? HIDDEN : formatCurrency(point.goalsSaved as number),
      });
    }

    if ((point.cardDebt as number) > 0) {
      rows.push({
        color: "#EF4444",
        label: t("debt"),
        value: privacy.hideValues ? HIDDEN : `-${formatCurrency(point.cardDebt as number)}`,
      });
    }

    return rows;
  };

  return (
    <div
      className="backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-colors duration-300 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)",
      }}
    >

      {}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg flex-shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-color" />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {t("wealthEvolution")}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleToggleVisibility}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={privacy.hideValues ? t("showValues") : t("hideValues")}
            aria-label={privacy.hideValues ? t("showValues") : t("hideValues")}
          >
            {privacy.hideValues ? (
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={tc("refresh")}
            aria-label={t("refreshChart")}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as EvolutionPeriod)}
              className="appearance-none select-icon-manual cursor-pointer px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-color)",
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
      </div>

      {}
      <div className="mb-3 sm:mb-4">
        <p className="text-lg sm:text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {privacy.hideValues ? HIDDEN : formatCurrency(summary.currentWealth)}
        </p>
        {privacy.hideValues ? (
          <div className="flex items-center gap-1 mt-1">
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--text-dimmed)]" />
            <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-dimmed)" }}>
              {t("discreteMode")}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
            )}
            <span
              className={`text-[10px] sm:text-sm font-medium ${
                isPositiveChange ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositiveChange ? "+" : ""}
              {formatCurrency(summary.wealthChange)}
            </span>
            <span className="text-[10px] sm:text-xs hidden sm:inline" style={{ color: "var(--text-dimmed)" }}>
              {tc("vsPrevMonth")}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <p id={descriptionId} className="sr-only">
        {t("wealthChartDesc")}
        {privacy.hideValues
          ? ` ${t("valuesHidden")}.`
          : ` ${t("patrimony")} ${formatCurrency(summary.currentWealth)}. ${summary.wealthChangePercent.toFixed(1)}% ${tc("vsPrevMonth")}.`
        }
      </p>
      <div className="h-48 sm:h-72" role="img" aria-describedby={descriptionId}>
        {isLoading ? (
          <div className="h-full flex flex-col justify-end">
            <div className="flex items-end justify-between gap-2 h-56">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <AreaChart
            data={chartData}
            xDataKey="date"
            margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
            aspectRatio="auto"
            className="h-full"
          >
            <Grid horizontal strokeDasharray="3,3" />
            <Area
              dataKey="transactionBalance"
              fill="#10B981"
              fillOpacity={0.2}
              stroke="#10B981"
              strokeWidth={1.5}
              fadeEdges
            />
            <Area
              dataKey="investmentValue"
              fill="#3B82F6"
              fillOpacity={0.2}
              stroke="#3B82F6"
              strokeWidth={1.5}
              fadeEdges
            />
            <Area
              dataKey="goalsSaved"
              fill="#F59E0B"
              fillOpacity={0.2}
              stroke="#F59E0B"
              strokeWidth={1.5}
              fadeEdges
            />
            <Area
              dataKey="cardDebt"
              fill="#EF4444"
              fillOpacity={0.2}
              stroke="#EF4444"
              strokeWidth={1.5}
              fadeEdges
            />
            <Area
              dataKey="totalWealth"
              fill="#8B5CF6"
              fillOpacity={0.4}
              stroke="#8B5CF6"
              strokeWidth={2}
              fadeEdges
            />
            <XAxis numTicks={5} />
            <ChartTooltip
              showDatePill
              rows={tooltipRowsGenerator}
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

      {}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              {t("balance")}
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.transactionBalance)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              {t("invested")}
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.investmentValue)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              {t("goals")}
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {privacy.hideValues ? HIDDEN : formatCurrency(summary.goalsSaved)}
          </p>
        </div>
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs truncate" style={{ color: "var(--text-dimmed)" }}>
              {t("debt")}
            </span>
          </div>
          <p className="text-[10px] sm:text-sm font-medium text-red-400 truncate">
            {privacy.hideValues ? HIDDEN : `-${formatCurrency(summary.cardDebt)}`}
          </p>
        </div>
      </div>

      {/* Modal de configuração de PIN */}
      <SetupPinModal
        open={showSetupPinModal}
        onClose={() => setShowSetupPinModal(false)}
        onSuccess={handlePinSetupSuccess}
      />

      {/* Modal de verificação de PIN */}
      <VerifyPinModal
        open={showVerifyPinModal}
        onClose={() => setShowVerifyPinModal(false)}
        onVerified={handlePinVerified}
      />
    </div>
  );
}
