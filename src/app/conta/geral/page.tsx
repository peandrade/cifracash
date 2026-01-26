"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  DollarSign,
  Calendar,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  useGeneralSettings,
  currencies,
  numberFormats,
  dateFormats,
  weekStartDays,
  commonTimezones,
  type Currency,
  type NumberFormat,
  type DateFormat,
  type WeekStartDay,
} from "@/contexts";

export default function GeralPage() {
  const router = useRouter();
  const { settings, updateSettings, resetSettings } = useGeneralSettings();

  const currencyEntries = Object.entries(currencies) as [Currency, typeof currencies[Currency]][];
  const numberFormatEntries = Object.entries(numberFormats) as [NumberFormat, typeof numberFormats[NumberFormat]][];
  const dateFormatEntries = Object.entries(dateFormats) as [DateFormat, typeof dateFormats[DateFormat]][];
  const weekStartDayEntries = Object.entries(weekStartDays) as [WeekStartDay, typeof weekStartDays[WeekStartDay]][];

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão Voltar */}
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Geral
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              Configurações financeiras e preferências de exibição
            </p>
          </div>
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-all"
            title="Restaurar padrões"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Configurações Financeiras */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Configurações Financeiras
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Moeda, formato de valores e ciclo mensal
                </p>
              </div>
            </div>

            {/* Moeda Padrão */}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">Moeda Padrão</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currencyEntries.map(([key, currency]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ currency: key })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      settings.currency === key
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      {currency.symbol}
                    </span>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">{key}</p>
                    {settings.currency === key && (
                      <div className="flex justify-center mt-2">
                        <Check className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Formato de Valores */}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">Formato de Valores</p>
              <div className="grid grid-cols-2 gap-3">
                {numberFormatEntries.map(([key, format]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ numberFormat: key })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      settings.numberFormat === key
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-lg font-semibold text-[var(--text-primary)]">
                      {format.example}
                    </span>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">{format.name}</p>
                    {settings.numberFormat === key && (
                      <div className="flex justify-center mt-2">
                        <Check className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Primeiro Dia do Mês Financeiro */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">Primeiro Dia do Mês Financeiro</p>
              <p className="text-xs text-[var(--text-dimmed)] mb-3">
                Para quem recebe salário em dias específicos
              </p>
              <select
                value={settings.financialMonthStartDay}
                onChange={(e) => updateSettings({ financialMonthStartDay: Number(e.target.value) })}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    Dia {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferências de Exibição */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Preferências de Exibição
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Data, semana e fuso horário
                </p>
              </div>
            </div>

            {/* Formato de Data */}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">Formato de Data</p>
              <div className="grid grid-cols-3 gap-3">
                {dateFormatEntries.map(([key, format]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ dateFormat: key })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      settings.dateFormat === key
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {format.name}
                    </span>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">{format.example}</p>
                    {settings.dateFormat === key && (
                      <div className="flex justify-center mt-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Primeiro Dia da Semana */}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">Primeiro Dia da Semana</p>
              <div className="grid grid-cols-2 gap-3">
                {weekStartDayEntries.map(([key, day]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ weekStartDay: key })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      settings.weekStartDay === key
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {day.name}
                    </span>
                    {settings.weekStartDay === key && (
                      <div className="flex justify-center mt-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuso Horário */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">Fuso Horário</p>
              <select
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {commonTimezones.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card de Resumo */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Settings className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Configurações Atuais
                </h2>
                <p className="text-sm text-[var(--text-dimmed)]">
                  Resumo das suas preferências
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Moeda</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {currencies[settings.currency].symbol} ({settings.currency})
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Valores</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {numberFormats[settings.numberFormat].example}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Mês Financeiro</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Dia {settings.financialMonthStartDay}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Data</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {dateFormats[settings.dateFormat].name}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Semana</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {weekStartDays[settings.weekStartDay].name}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-hover)]">
                <p className="text-xs text-[var(--text-dimmed)]">Fuso</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {settings.timezone === "auto" ? "Auto" : settings.timezone.split("/")[1]?.replace("_", " ") || settings.timezone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
