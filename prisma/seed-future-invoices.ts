/**
 * SEED - Faturas Futuras
 *
 * Adiciona faturas de março a junho de 2026 para os cartões existentes.
 * Respeita o limite do cartão - uso total fica entre 40-70% do limite.
 *
 * Execução: npx ts-node prisma/seed-future-invoices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "cml8dqk1x0000qeskfc4ykxg2";

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDateInMonth(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  return new Date(year, month, safeDay, 12, 0, 0, 0);
}

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       📅 CRIANDO FATURAS FUTURAS (MAR-JUN 2026)          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Buscar cartões do usuário
  const cards = await prisma.creditCard.findMany({
    where: { userId: USER_ID },
  });

  if (cards.length === 0) {
    console.error("❌ Nenhum cartão encontrado. Execute o seed-demo.ts primeiro.");
    process.exit(1);
  }

  console.log(`✅ ${cards.length} cartões encontrados\n`);

  // Primeiro, deletar faturas futuras existentes (março em diante)
  console.log("🧹 Removendo faturas futuras existentes...");

  for (const card of cards) {
    // Buscar faturas de março 2026 em diante
    const futureInvoices = await prisma.invoice.findMany({
      where: {
        creditCardId: card.id,
        OR: [
          { year: 2026, month: { gte: 3 } }, // Março+ 2026
          { year: { gt: 2026 } }, // 2027+
        ],
      },
    });

    for (const invoice of futureInvoices) {
      // Deletar compras da fatura
      await prisma.purchase.deleteMany({
        where: { invoiceId: invoice.id },
      });
      // Deletar fatura
      await prisma.invoice.delete({
        where: { id: invoice.id },
      });
    }
  }
  console.log("   ✓ Faturas antigas removidas\n");

  const purchaseCategories = [
    { category: "Alimentação", descriptions: ["iFood", "Rappi", "Outback", "Starbucks", "McDonald's"], minValue: 25, maxValue: 180 },
    { category: "Compras", descriptions: ["Amazon", "Mercado Livre", "Shopee", "Magazine Luiza"], minValue: 50, maxValue: 400 },
    { category: "Transporte", descriptions: ["Uber", "99", "Shell", "Ipiranga"], minValue: 18, maxValue: 150 },
    { category: "Lazer", descriptions: ["Cinemark", "Steam", "PlayStation Store"], minValue: 25, maxValue: 150 },
    { category: "Assinaturas", descriptions: ["Spotify", "Netflix", "Disney+", "HBO Max"], minValue: 15, maxValue: 60 },
    { category: "Vestuário", descriptions: ["Reserva", "Zara", "Nike", "Renner"], minValue: 80, maxValue: 300 },
    { category: "Saúde", descriptions: ["Drogasil", "Droga Raia"], minValue: 30, maxValue: 150 },
  ];

  // Meses futuros: Março (2), Abril (3), Maio (4), Junho (5) de 2026
  const futureMonths = [
    { month: 2, year: 2026, name: "Março" },
    { month: 3, year: 2026, name: "Abril" },
    { month: 4, year: 2026, name: "Maio" },
    { month: 5, year: 2026, name: "Junho" },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPurchases: any[] = [];
  const invoiceUpdates: Array<{ id: string; total: number }> = [];

  let totalInvoices = 0;
  let totalPurchases = 0;

  for (const card of cards) {
    const limit = parseFloat(card.limit as string);

    // Calcular uso atual (faturas abertas/fechadas não pagas)
    const currentInvoices = await prisma.invoice.findMany({
      where: {
        creditCardId: card.id,
        status: { in: ["open", "closed", "overdue"] },
      },
    });

    const currentUsage = currentInvoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.total as string);
    }, 0);

    // Limite disponível para faturas futuras
    // Queremos que o uso total fique entre 40-65% do limite
    const targetUsagePercent = randomBetween(0.40, 0.65);
    const targetTotalUsage = limit * targetUsagePercent;
    const availableForFuture = Math.max(0, targetTotalUsage - currentUsage);

    // Distribuir entre os 4 meses futuros
    const avgPerMonth = availableForFuture / 4;

    console.log(`💳 ${card.name}`);
    console.log(`   Limite: R$ ${limit.toLocaleString("pt-BR")}`);
    console.log(`   Uso atual: R$ ${currentUsage.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${((currentUsage / limit) * 100).toFixed(1)}%)`);
    console.log(`   Meta de uso: ${(targetUsagePercent * 100).toFixed(0)}%`);

    for (const { month, year, name } of futureMonths) {
      const closingDate = new Date(year, month, card.closingDay);
      const dueDate = new Date(year, month, card.dueDay);

      const invoice = await prisma.invoice.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          creditCardId: card.id,
          month: month + 1,
          year,
          closingDate,
          dueDate,
          status: "open",
          total: String(0),
          paidAmount: String(0),
        } as any,
      });

      // Valor alvo para este mês (com variação de ±20%)
      const monthTarget = avgPerMonth * randomBetween(0.8, 1.2);
      let invoiceTotal = 0;

      // Adicionar compras até atingir o target
      while (invoiceTotal < monthTarget * 0.85) {
        const catInfo = pickRandom(purchaseCategories);
        const description = pickRandom(catInfo.descriptions);

        // Ajustar valor máximo baseado no quanto falta
        const remaining = monthTarget - invoiceTotal;
        const maxValue = Math.min(catInfo.maxValue, remaining * 0.5);

        if (maxValue < catInfo.minValue) break;

        const value = randomBetween(catInfo.minValue, maxValue);

        // Algumas compras parceladas (poucas)
        const isInstallment = Math.random() > 0.85;
        const installments = isInstallment ? pickRandom([2, 3]) : 1;
        const installmentValue = Math.round((value / installments) * 100) / 100;

        allPurchases.push({
          invoiceId: invoice.id,
          description: isInstallment ? `${description} (${installments}x)` : description,
          value: String(installmentValue),
          totalValue: String(value),
          category: catInfo.category,
          date: getDateInMonth(year, month, randomInt(1, 28)),
          installments,
          currentInstallment: 1,
        });

        invoiceTotal += installmentValue;
        totalPurchases++;
      }

      // Adicionar algumas parcelas de compras anteriores
      const installmentCount = randomInt(2, 5);
      for (let i = 0; i < installmentCount; i++) {
        if (invoiceTotal >= monthTarget) break;

        const installmentValue = randomBetween(40, 150);
        const currentInstallment = randomInt(2, 6);
        const totalInstallments = currentInstallment + randomInt(1, 4);

        allPurchases.push({
          invoiceId: invoice.id,
          description: `${pickRandom(["Amazon", "Magazine Luiza", "Kabum"])} (${currentInstallment}/${totalInstallments})`,
          value: String(installmentValue),
          totalValue: String(installmentValue * totalInstallments),
          category: "Compras",
          date: getDateInMonth(2026, 1, randomInt(1, 28)), // Compra feita em fevereiro
          installments: totalInstallments,
          currentInstallment,
        });

        invoiceTotal += installmentValue;
        totalPurchases++;
      }

      invoiceUpdates.push({ id: invoice.id, total: invoiceTotal });
      totalInvoices++;

      console.log(`   ✓ ${name}: R$ ${invoiceTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    }

    // Calcular uso total projetado
    const futureUsage = invoiceUpdates
      .filter(u => allPurchases.some(p => p.invoiceId === u.id))
      .slice(-4)
      .reduce((sum, u) => sum + u.total, 0);

    const projectedTotal = currentUsage + futureUsage;
    console.log(`   📊 Uso projetado: R$ ${projectedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${((projectedTotal / limit) * 100).toFixed(1)}%)`);
    console.log("");
  }

  // Inserir todas as compras
  if (allPurchases.length > 0) {
    console.log(`📝 Inserindo ${allPurchases.length} compras...`);
    await prisma.purchase.createMany({ data: allPurchases });
  }

  // Atualizar totais das faturas
  for (const update of invoiceUpdates) {
    await prisma.invoice.update({
      where: { id: update.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { total: String(update.total) } as any,
    });
  }

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ CONCLUÍDO                          ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  📅 Faturas criadas:           ${String(totalInvoices).padEnd(24)}║`);
  console.log(`║  🛒 Compras adicionadas:       ${String(totalPurchases).padEnd(24)}║`);
  console.log("║                                                          ║");
  console.log("║  ✓ Uso de todos os cartões entre 40-65% do limite       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
