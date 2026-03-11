import jsPDF from "jspdf";
import { formatCurrency } from "./utils";
import type { Transaction } from "@/types";
import type { Category } from "@/store/category-store";
import type { RefObject } from "react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface GeneratePDFOptions {
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  filterType: "expense" | "income" | "all";
  reportRef: RefObject<HTMLDivElement | null>;
}

interface CategorySummary {
  name: string;
  total: number;
  count: number;
  color: string;
  percentage: number;
}

const colors = {
  primary: [139, 92, 246] as [number, number, number],
  primaryDark: [109, 62, 216] as [number, number, number],
  secondary: [99, 102, 241] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  successLight: [209, 250, 229] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dangerLight: [254, 226, 226] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  warningLight: [254, 243, 199] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  infoLight: [219, 234, 254] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textSecondary: [71, 85, 105] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
  ];
}

function drawRoundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  style: "F" | "S" | "FD" = "F"
) {
  pdf.roundedRect(x, y, width, height, radius, radius, style);
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export async function generateReportPDF({
  transactions,
  categories,
  month,
  year,
  filterType,
}: GeneratePDFOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = 0;

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const daysInMonth = getDaysInMonth(month, year);
  const avgDailySpending = totalExpense / daysInMonth;

  // Category summary
  const categorySummary: CategorySummary[] = (() => {
    const grouped = filtered.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { total: 0, count: 0 };
      }
      acc[t.category].total += t.value;
      acc[t.category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const total = Object.values(grouped).reduce((sum, { total }) => sum + total, 0);

    return Object.entries(grouped)
      .map(([name, { total: value, count }]) => {
        const category = categories.find((c) => c.name === name);
        return {
          name,
          total: value,
          count,
          color: category?.color || "#64748B",
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  })();

  // Top transactions
  const topExpenses = [...transactions]
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topIncomes = [...transactions]
    .filter((t) => t.type === "income")
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // ==================== PAGE 1 ====================

  // Header gradient background
  const gradientHeight = 55;
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, gradientHeight, "F");

  // Add subtle pattern overlay
  pdf.setFillColor(...colors.primaryDark);
  for (let i = 0; i < 5; i++) {
    pdf.circle(pageWidth - 20 + i * 15, 15 + i * 8, 30, "F");
  }
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth - 40, gradientHeight, "F");

  // Logo and title
  pdf.setTextColor(...colors.white);
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("CifraCash", margin, 22);

  // Subtitle
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("Relatório Financeiro Mensal", margin, 32);

  // Period badge
  pdf.setFillColor(255, 255, 255, 0.2);
  const periodText = `${MONTHS[month - 1]} ${year}`;
  const periodWidth = pdf.getTextWidth(periodText) + 16;
  drawRoundedRect(pdf, margin, 38, periodWidth, 10, 5, "F");
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(periodText, margin + 8, 45);

  // Generation date
  const now = new Date();
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - margin,
    45,
    { align: "right" }
  );

  yPosition = gradientHeight + 15;

  // ==================== SUMMARY SECTION ====================
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Resumo Financeiro", margin, yPosition);
  yPosition += 10;

  // Summary cards
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 35;

  // Income card
  pdf.setFillColor(...colors.successLight);
  drawRoundedRect(pdf, margin, yPosition, cardWidth, cardHeight, 4, "F");
  pdf.setFillColor(...colors.success);
  drawRoundedRect(pdf, margin, yPosition, 4, cardHeight, 2, "F");

  pdf.setTextColor(...colors.success);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("RECEITAS", margin + 10, yPosition + 10);
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(16);
  pdf.text(formatCurrency(totalIncome), margin + 10, yPosition + 22);
  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  const incomeCount = transactions.filter(t => t.type === "income").length;
  pdf.text(`${incomeCount} transação${incomeCount !== 1 ? "ões" : ""}`, margin + 10, yPosition + 30);

  // Expense card
  const expenseCardX = margin + cardWidth + 5;
  pdf.setFillColor(...colors.dangerLight);
  drawRoundedRect(pdf, expenseCardX, yPosition, cardWidth, cardHeight, 4, "F");
  pdf.setFillColor(...colors.danger);
  drawRoundedRect(pdf, expenseCardX, yPosition, 4, cardHeight, 2, "F");

  pdf.setTextColor(...colors.danger);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("DESPESAS", expenseCardX + 10, yPosition + 10);
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(16);
  pdf.text(formatCurrency(totalExpense), expenseCardX + 10, yPosition + 22);
  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  const expenseCount = transactions.filter(t => t.type === "expense").length;
  pdf.text(`${expenseCount} transação${expenseCount !== 1 ? "ões" : ""}`, expenseCardX + 10, yPosition + 30);

  // Balance card
  const balanceCardX = margin + (cardWidth + 5) * 2;
  const isPositive = balance >= 0;
  const balanceBgColor = isPositive ? colors.infoLight : colors.warningLight;
  const balanceAccentColor = isPositive ? colors.info : colors.warning;
  pdf.setFillColor(...balanceBgColor);
  drawRoundedRect(pdf, balanceCardX, yPosition, cardWidth, cardHeight, 4, "F");
  pdf.setFillColor(...balanceAccentColor);
  drawRoundedRect(pdf, balanceCardX, yPosition, 4, cardHeight, 2, "F");

  pdf.setTextColor(...balanceAccentColor);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("SALDO", balanceCardX + 10, yPosition + 10);
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(16);
  pdf.text(formatCurrency(balance), balanceCardX + 10, yPosition + 22);
  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(isPositive ? "Superávit" : "Déficit", balanceCardX + 10, yPosition + 30);

  yPosition += cardHeight + 15;

  // ==================== KEY METRICS ====================
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Indicadores Financeiros", margin, yPosition);
  yPosition += 10;

  // Metrics cards (2 columns)
  const metricCardWidth = (contentWidth - 5) / 2;
  const metricCardHeight = 25;

  // Savings rate
  pdf.setFillColor(...colors.background);
  drawRoundedRect(pdf, margin, yPosition, metricCardWidth, metricCardHeight, 4, "F");
  pdf.setDrawColor(...colors.border);
  drawRoundedRect(pdf, margin, yPosition, metricCardWidth, metricCardHeight, 4, "S");

  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Taxa de Economia", margin + 8, yPosition + 9);
  const savingsColor = savingsRate >= 0 ? colors.success : colors.danger;
  pdf.setTextColor(...savingsColor);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${savingsRate.toFixed(1)}%`, margin + 8, yPosition + 19);

  // Average daily spending
  pdf.setFillColor(...colors.background);
  drawRoundedRect(pdf, margin + metricCardWidth + 5, yPosition, metricCardWidth, metricCardHeight, 4, "F");
  pdf.setDrawColor(...colors.border);
  drawRoundedRect(pdf, margin + metricCardWidth + 5, yPosition, metricCardWidth, metricCardHeight, 4, "S");

  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Gasto Médio Diário", margin + metricCardWidth + 13, yPosition + 9);
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(avgDailySpending), margin + metricCardWidth + 13, yPosition + 19);

  yPosition += metricCardHeight + 15;

  // ==================== CATEGORY BREAKDOWN ====================
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  const filterLabel = filterType === "expense" ? "Despesas" : filterType === "income" ? "Receitas" : "Transações";
  pdf.text(`${filterLabel} por Categoria`, margin, yPosition);
  yPosition += 8;

  // Category table header
  pdf.setFillColor(...colors.primary);
  drawRoundedRect(pdf, margin, yPosition, contentWidth, 10, 3, "F");

  pdf.setTextColor(...colors.white);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Categoria", margin + 8, yPosition + 7);
  pdf.text("Qtd", margin + 95, yPosition + 7, { align: "center" });
  pdf.text("Total", margin + 130, yPosition + 7, { align: "right" });
  pdf.text("%", margin + 160, yPosition + 7, { align: "right" });
  yPosition += 12;

  // Category rows
  pdf.setFont("helvetica", "normal");
  const maxCategoriesToShow = 10;
  const categoriesToShow = categorySummary.slice(0, maxCategoriesToShow);

  categoriesToShow.forEach((item, index) => {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(...colors.background);
      pdf.rect(margin, yPosition - 4, contentWidth, 10, "F");
    }

    // Category color indicator
    const rgb = hexToRgb(item.color);
    pdf.setFillColor(...rgb);
    pdf.circle(margin + 4, yPosition, 2.5, "F");

    // Category data
    pdf.setTextColor(...colors.text);
    pdf.setFontSize(9);
    const categoryName = item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name;
    pdf.text(categoryName, margin + 10, yPosition + 1);

    pdf.setTextColor(...colors.textSecondary);
    pdf.text(`${item.count}`, margin + 95, yPosition + 1, { align: "center" });

    pdf.setTextColor(...colors.text);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatCurrency(item.total), margin + 130, yPosition + 1, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.muted);
    pdf.text(`${item.percentage.toFixed(1)}%`, margin + 160, yPosition + 1, { align: "right" });

    // Progress bar
    const barMaxWidth = 15;
    const barWidth = (item.percentage / 100) * barMaxWidth;
    pdf.setFillColor(...colors.border);
    drawRoundedRect(pdf, margin + 163, yPosition - 2, barMaxWidth, 4, 1, "F");
    pdf.setFillColor(...rgb);
    if (barWidth > 0) {
      drawRoundedRect(pdf, margin + 163, yPosition - 2, barWidth, 4, 1, "F");
    }

    yPosition += 10;
  });

  // Total row
  yPosition += 2;
  pdf.setFillColor(...colors.primary);
  drawRoundedRect(pdf, margin, yPosition - 4, contentWidth, 10, 3, "F");

  pdf.setTextColor(...colors.white);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("TOTAL", margin + 10, yPosition + 1);
  pdf.text(`${filtered.length}`, margin + 95, yPosition + 1, { align: "center" });
  const totalFiltered = categorySummary.reduce((sum, item) => sum + item.total, 0);
  pdf.text(formatCurrency(totalFiltered), margin + 130, yPosition + 1, { align: "right" });
  pdf.text("100%", margin + 160, yPosition + 1, { align: "right" });

  yPosition += 15;

  // ==================== PAGE 2 - TOP TRANSACTIONS ====================
  if (topExpenses.length > 0 || topIncomes.length > 0) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    // Top Expenses Section
    if (topExpenses.length > 0) {
      pdf.setTextColor(...colors.text);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Maiores Despesas do Mês", margin, yPosition);
      yPosition += 8;

      topExpenses.forEach((t, index) => {
        const rowY = yPosition + index * 12;

        // Row background
        const rowBgColor = index % 2 === 0 ? colors.background : colors.white;
        pdf.setFillColor(...rowBgColor);
        drawRoundedRect(pdf, margin, rowY - 3, contentWidth, 10, 2, "F");

        // Rank badge
        pdf.setFillColor(...colors.danger);
        pdf.circle(margin + 5, rowY + 1, 3.5, "F");
        pdf.setTextColor(...colors.white);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${index + 1}`, margin + 5, rowY + 2.5, { align: "center" });

        // Transaction details
        pdf.setTextColor(...colors.text);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const desc = t.description.length > 35 ? t.description.substring(0, 32) + "..." : t.description;
        pdf.text(desc, margin + 12, rowY + 2);

        // Date
        pdf.setTextColor(...colors.muted);
        pdf.setFontSize(8);
        const date = new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        pdf.text(date, margin + 110, rowY + 2);

        // Value
        pdf.setTextColor(...colors.danger);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(t.value), margin + 160, rowY + 2, { align: "right" });
      });

      yPosition += topExpenses.length * 12 + 15;
    }

    // Top Incomes Section
    if (topIncomes.length > 0) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setTextColor(...colors.text);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Maiores Receitas do Mês", margin, yPosition);
      yPosition += 8;

      topIncomes.forEach((t, index) => {
        const rowY = yPosition + index * 12;

        // Row background
        const rowBgColor = index % 2 === 0 ? colors.background : colors.white;
        pdf.setFillColor(...rowBgColor);
        drawRoundedRect(pdf, margin, rowY - 3, contentWidth, 10, 2, "F");

        // Rank badge
        pdf.setFillColor(...colors.success);
        pdf.circle(margin + 5, rowY + 1, 3.5, "F");
        pdf.setTextColor(...colors.white);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${index + 1}`, margin + 5, rowY + 2.5, { align: "center" });

        // Transaction details
        pdf.setTextColor(...colors.text);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const desc = t.description.length > 35 ? t.description.substring(0, 32) + "..." : t.description;
        pdf.text(desc, margin + 12, rowY + 2);

        // Date
        pdf.setTextColor(...colors.muted);
        pdf.setFontSize(8);
        const date = new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        pdf.text(date, margin + 110, rowY + 2);

        // Value
        pdf.setTextColor(...colors.success);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatCurrency(t.value), margin + 160, rowY + 2, { align: "right" });
      });

      yPosition += topIncomes.length * 12 + 15;
    }
  }

  // ==================== INSIGHTS SECTION ====================
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Análise do Período", margin, yPosition);
  yPosition += 10;

  // Insights box
  pdf.setFillColor(...colors.background);
  drawRoundedRect(pdf, margin, yPosition, contentWidth, 40, 4, "F");
  pdf.setDrawColor(...colors.border);
  drawRoundedRect(pdf, margin, yPosition, contentWidth, 40, 4, "S");

  const insights: string[] = [];

  if (savingsRate >= 20) {
    insights.push(`Excelente! Você economizou ${savingsRate.toFixed(1)}% da sua renda este mês.`);
  } else if (savingsRate >= 10) {
    insights.push(`Bom trabalho! Taxa de economia de ${savingsRate.toFixed(1)}%.`);
  } else if (savingsRate >= 0) {
    insights.push(`Sua taxa de economia foi de ${savingsRate.toFixed(1)}%. Tente aumentar para pelo menos 20%.`);
  } else {
    insights.push(`Atenção: Você gastou mais do que ganhou este mês.`);
  }

  if (categorySummary.length > 0) {
    const topCategory = categorySummary[0];
    insights.push(`Maior categoria: ${topCategory.name} (${topCategory.percentage.toFixed(1)}% do total).`);
  }

  if (avgDailySpending > 0) {
    insights.push(`Gasto médio diário: ${formatCurrency(avgDailySpending)}.`);
  }

  pdf.setTextColor(...colors.textSecondary);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");

  insights.forEach((insight, index) => {
    pdf.text(`• ${insight}`, margin + 8, yPosition + 10 + index * 10);
  });

  // ==================== FOOTER ====================
  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(...colors.border);
    pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    // Footer text
    pdf.setTextColor(...colors.muted);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `CifraCash - Gestão Financeira Pessoal`,
      margin,
      pageHeight - 12
    );
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: "right" }
    );
    pdf.text(
      `Relatório confidencial gerado em ${now.toLocaleDateString("pt-BR")}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `relatorio-financeiro-${MONTHS[month - 1].toLowerCase()}-${year}.pdf`;
  pdf.save(fileName);
}
