import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

export async function generateReportPDF({
  transactions,
  categories,
  month,
  year,
  filterType,
  reportRef,
}: GeneratePDFOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  const colors = {
    primary: [139, 92, 246] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    info: [59, 130, 246] as [number, number, number],
    text: [30, 41, 59] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    light: [241, 245, 249] as [number, number, number],
  };

  const filtered = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIncome - totalExpense;

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

  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("CifraCash", margin, 20);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Relatório Financeiro - ${MONTHS[month - 1]} ${year}`, margin, 30);

  const now = new Date();
  pdf.setFontSize(10);
  pdf.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - margin,
    30,
    { align: "right" }
  );

  yPosition = 55;

  const cardWidth = (pageWidth - margin * 2 - 10) / 3;
  const cardHeight = 25;

  pdf.setFillColor(...colors.success);
  pdf.roundedRect(margin, yPosition, cardWidth, cardHeight, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text("Receitas", margin + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(totalIncome), margin + 5, yPosition + 18);

  pdf.setFillColor(...colors.danger);
  pdf.roundedRect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Despesas", margin + cardWidth + 10, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(totalExpense), margin + cardWidth + 10, yPosition + 18);

  pdf.setFillColor(balance >= 0 ? colors.info[0] : 249, balance >= 0 ? colors.info[1] : 115, balance >= 0 ? colors.info[2] : 22);
  pdf.roundedRect(margin + (cardWidth + 5) * 2, yPosition, cardWidth, cardHeight, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Saldo", margin + (cardWidth + 5) * 2 + 5, yPosition + 8);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(balance), margin + (cardWidth + 5) * 2 + 5, yPosition + 18);

  yPosition += cardHeight + 15;

  if (reportRef.current) {
    try {
      const chartElement = reportRef.current.querySelector(".recharts-wrapper");
      if (chartElement) {
        const canvas = await html2canvas(chartElement as HTMLElement, {
          backgroundColor: "#1a1a2e",
          scale: 2,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const imgX = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, "PNG", imgX, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }
    } catch (error) {
      console.error("Erro ao capturar gráfico:", error);
    }
  }

  pdf.setTextColor(...colors.text);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Detalhamento por Categoria", margin, yPosition);
  yPosition += 10;

  pdf.setFillColor(...colors.light);
  pdf.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, "F");

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...colors.text);
  pdf.text("#", margin + 2, yPosition);
  pdf.text("Categoria", margin + 12, yPosition);
  pdf.text("Qtd", margin + 85, yPosition);
  pdf.text("Total", margin + 105, yPosition);
  pdf.text("%", margin + 145, yPosition);
  yPosition += 8;

  pdf.setFont("helvetica", "normal");
  categorySummary.forEach((item, index) => {

    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, "F");
    }

    const colorHex = item.color.replace("#", "");
    const r = parseInt(colorHex.substring(0, 2), 16);
    const g = parseInt(colorHex.substring(2, 4), 16);
    const b = parseInt(colorHex.substring(4, 6), 16);
    pdf.setFillColor(r, g, b);
    pdf.circle(margin + 6, yPosition - 1, 2, "F");

    pdf.setTextColor(...colors.text);
    pdf.text(`${index + 1}`, margin + 2, yPosition);
    pdf.text(item.name.substring(0, 25), margin + 12, yPosition);
    pdf.text(`${item.count}`, margin + 85, yPosition);
    pdf.text(formatCurrency(item.total), margin + 105, yPosition);
    pdf.text(`${item.percentage.toFixed(1)}%`, margin + 145, yPosition);

    yPosition += 8;
  });

  yPosition += 4;
  pdf.setFillColor(...colors.primary);
  pdf.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("TOTAL", margin + 12, yPosition);
  pdf.text(`${filtered.length}`, margin + 85, yPosition);
  const totalFiltered = categorySummary.reduce((sum, item) => sum + item.total, 0);
  pdf.text(formatCurrency(totalFiltered), margin + 105, yPosition);
  pdf.text("100%", margin + 145, yPosition);

  pdf.setTextColor(...colors.muted);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")} - CifraCash`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  const fileName = `relatorio-financeiro-${MONTHS[month - 1].toLowerCase()}-${year}.pdf`;
  pdf.save(fileName);
}
