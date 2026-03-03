import { PrismaClient, TransactionType, InvestmentType, InvoiceStatus, GoalCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper para criptografar valores (simulando o padrão do app)
function encryptValue(value: number): string {
  return value.toString();
}

async function main() {
  console.log("🌱 Iniciando seed para Março 2026...\n");

  // Limpar dados existentes do usuário demo (se existir)
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@cifracash.com" },
  });

  if (existingUser) {
    console.log("🗑️  Removendo dados existentes do usuário demo...");
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // ==================== USUÁRIO ====================
  console.log("👤 Criando usuário demo...");
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const user = await prisma.user.create({
    data: {
      name: "João Silva",
      email: "demo@cifracash.com",
      password: hashedPassword,
      generalSettings: {
        defaultPage: "dashboard",
        defaultPeriod: "month",
        defaultSort: "recent",
        confirmBeforeDelete: true,
      },
      notificationSettings: {
        budgetAlerts: true,
        billReminders: true,
        weeklyReport: true,
        monthlyReport: true,
      },
      privacySettings: {
        hideValues: false,
        autoLock: false,
        autoLockTimeout: 5,
      },
    },
  });

  // ==================== CATEGORIAS ====================
  console.log("📁 Criando categorias...");

  const incomeCategories = [
    { name: "Salário", icon: "Briefcase", color: "#10B981" },
    { name: "Freelance", icon: "Laptop", color: "#3B82F6" },
    { name: "Investimentos", icon: "TrendingUp", color: "#8B5CF6" },
    { name: "Vendas", icon: "ShoppingBag", color: "#F59E0B" },
    { name: "Outros", icon: "Plus", color: "#6B7280" },
  ];

  const expenseCategories = [
    { name: "Alimentação", icon: "UtensilsCrossed", color: "#EF4444" },
    { name: "Transporte", icon: "Car", color: "#3B82F6" },
    { name: "Moradia", icon: "Home", color: "#8B5CF6" },
    { name: "Saúde", icon: "Heart", color: "#EC4899" },
    { name: "Educação", icon: "GraduationCap", color: "#10B981" },
    { name: "Lazer", icon: "Gamepad2", color: "#F59E0B" },
    { name: "Compras", icon: "ShoppingCart", color: "#06B6D4" },
    { name: "Assinaturas", icon: "CreditCard", color: "#6366F1" },
    { name: "Pets", icon: "PawPrint", color: "#A855F7" },
    { name: "Outros", icon: "MoreHorizontal", color: "#6B7280" },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.create({
      data: { ...cat, type: TransactionType.income, userId: user.id },
    });
  }

  for (const cat of expenseCategories) {
    await prisma.category.create({
      data: { ...cat, type: TransactionType.expense, userId: user.id },
    });
  }

  // ==================== TRANSAÇÕES ====================
  console.log("💰 Criando transações (Jan-Mar 2026)...");

  const transactions = [
    // Janeiro 2026
    { type: TransactionType.income, category: "Salário", value: 8500, date: new Date("2026-01-05"), description: "Salário Janeiro" },
    { type: TransactionType.income, category: "Freelance", value: 2500, date: new Date("2026-01-15"), description: "Projeto website cliente X" },
    { type: TransactionType.expense, category: "Moradia", value: 2200, date: new Date("2026-01-10"), description: "Aluguel Janeiro" },
    { type: TransactionType.expense, category: "Alimentação", value: 450, date: new Date("2026-01-08"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Alimentação", value: 380, date: new Date("2026-01-22"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Transporte", value: 350, date: new Date("2026-01-12"), description: "Combustível" },
    { type: TransactionType.expense, category: "Saúde", value: 180, date: new Date("2026-01-18"), description: "Farmácia" },
    { type: TransactionType.expense, category: "Lazer", value: 250, date: new Date("2026-01-25"), description: "Cinema e jantar" },
    { type: TransactionType.expense, category: "Assinaturas", value: 55, date: new Date("2026-01-01"), description: "Netflix + Spotify" },
    { type: TransactionType.expense, category: "Educação", value: 199, date: new Date("2026-01-20"), description: "Curso online" },

    // Fevereiro 2026
    { type: TransactionType.income, category: "Salário", value: 8500, date: new Date("2026-02-05"), description: "Salário Fevereiro" },
    { type: TransactionType.income, category: "Investimentos", value: 320, date: new Date("2026-02-10"), description: "Dividendos FIIs" },
    { type: TransactionType.income, category: "Freelance", value: 1800, date: new Date("2026-02-20"), description: "Consultoria" },
    { type: TransactionType.expense, category: "Moradia", value: 2200, date: new Date("2026-02-10"), description: "Aluguel Fevereiro" },
    { type: TransactionType.expense, category: "Alimentação", value: 520, date: new Date("2026-02-07"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Alimentação", value: 410, date: new Date("2026-02-21"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Alimentação", value: 85, date: new Date("2026-02-14"), description: "Jantar romântico" },
    { type: TransactionType.expense, category: "Transporte", value: 380, date: new Date("2026-02-15"), description: "Combustível" },
    { type: TransactionType.expense, category: "Compras", value: 450, date: new Date("2026-02-14"), description: "Presente Dia dos Namorados" },
    { type: TransactionType.expense, category: "Saúde", value: 350, date: new Date("2026-02-22"), description: "Consulta médica" },
    { type: TransactionType.expense, category: "Assinaturas", value: 55, date: new Date("2026-02-01"), description: "Netflix + Spotify" },
    { type: TransactionType.expense, category: "Pets", value: 280, date: new Date("2026-02-18"), description: "Ração e veterinário" },

    // Março 2026
    { type: TransactionType.income, category: "Salário", value: 8500, date: new Date("2026-03-05"), description: "Salário Março" },
    { type: TransactionType.income, category: "Investimentos", value: 285, date: new Date("2026-03-12"), description: "Dividendos ações" },
    { type: TransactionType.income, category: "Freelance", value: 3200, date: new Date("2026-03-18"), description: "Projeto app mobile" },
    { type: TransactionType.income, category: "Vendas", value: 800, date: new Date("2026-03-22"), description: "Venda equipamento usado" },
    { type: TransactionType.expense, category: "Moradia", value: 2200, date: new Date("2026-03-10"), description: "Aluguel Março" },
    { type: TransactionType.expense, category: "Moradia", value: 180, date: new Date("2026-03-15"), description: "Conta de luz" },
    { type: TransactionType.expense, category: "Moradia", value: 95, date: new Date("2026-03-15"), description: "Conta de água" },
    { type: TransactionType.expense, category: "Moradia", value: 120, date: new Date("2026-03-16"), description: "Internet" },
    { type: TransactionType.expense, category: "Alimentação", value: 580, date: new Date("2026-03-06"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Alimentação", value: 450, date: new Date("2026-03-20"), description: "Supermercado" },
    { type: TransactionType.expense, category: "Alimentação", value: 120, date: new Date("2026-03-08"), description: "Restaurante" },
    { type: TransactionType.expense, category: "Alimentação", value: 95, date: new Date("2026-03-15"), description: "Lanche delivery" },
    { type: TransactionType.expense, category: "Transporte", value: 320, date: new Date("2026-03-10"), description: "Combustível" },
    { type: TransactionType.expense, category: "Transporte", value: 150, date: new Date("2026-03-25"), description: "Uber/99" },
    { type: TransactionType.expense, category: "Saúde", value: 89, date: new Date("2026-03-12"), description: "Farmácia" },
    { type: TransactionType.expense, category: "Saúde", value: 150, date: new Date("2026-03-01"), description: "Academia" },
    { type: TransactionType.expense, category: "Lazer", value: 180, date: new Date("2026-03-14"), description: "Happy hour" },
    { type: TransactionType.expense, category: "Lazer", value: 350, date: new Date("2026-03-28"), description: "Show" },
    { type: TransactionType.expense, category: "Compras", value: 290, date: new Date("2026-03-19"), description: "Roupas" },
    { type: TransactionType.expense, category: "Assinaturas", value: 55, date: new Date("2026-03-01"), description: "Netflix + Spotify" },
    { type: TransactionType.expense, category: "Assinaturas", value: 45, date: new Date("2026-03-01"), description: "iCloud + Prime" },
    { type: TransactionType.expense, category: "Educação", value: 199, date: new Date("2026-03-20"), description: "Curso online" },
    { type: TransactionType.expense, category: "Pets", value: 180, date: new Date("2026-03-22"), description: "Ração" },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        value: encryptValue(tx.value),
        userId: user.id,
      },
    });
  }

  // ==================== TEMPLATES ====================
  console.log("📋 Criando templates de transação...");

  const templates = [
    { name: "Supermercado", category: "Alimentação", type: TransactionType.expense, value: 500, usageCount: 15 },
    { name: "Combustível", category: "Transporte", type: TransactionType.expense, value: 350, usageCount: 8 },
    { name: "Aluguel", category: "Moradia", type: TransactionType.expense, value: 2200, usageCount: 3 },
    { name: "Salário", category: "Salário", type: TransactionType.income, value: 8500, usageCount: 3 },
    { name: "Freelance", category: "Freelance", type: TransactionType.income, value: 2000, usageCount: 5 },
    { name: "Netflix", category: "Assinaturas", type: TransactionType.expense, value: 40, usageCount: 3 },
    { name: "Academia", category: "Saúde", type: TransactionType.expense, value: 150, usageCount: 3 },
  ];

  for (const tpl of templates) {
    await prisma.transactionTemplate.create({
      data: {
        ...tpl,
        value: encryptValue(tpl.value),
        userId: user.id,
      },
    });
  }

  // ==================== INVESTIMENTOS ====================
  console.log("📈 Criando investimentos...");

  const investments = [
    // Ações
    {
      type: InvestmentType.stock,
      name: "Petrobras",
      ticker: "PETR4",
      institution: "XP Investimentos",
      quantity: "100",
      averagePrice: "36.50",
      currentPrice: "42.80",
      totalInvested: "3650.00",
      currentValue: "4280.00",
      profitLoss: "630.00",
      profitLossPercent: "17.26",
    },
    {
      type: InvestmentType.stock,
      name: "Vale",
      ticker: "VALE3",
      institution: "XP Investimentos",
      quantity: "80",
      averagePrice: "68.20",
      currentPrice: "72.45",
      totalInvested: "5456.00",
      currentValue: "5796.00",
      profitLoss: "340.00",
      profitLossPercent: "6.23",
    },
    {
      type: InvestmentType.stock,
      name: "Itaú Unibanco",
      ticker: "ITUB4",
      institution: "Rico",
      quantity: "150",
      averagePrice: "32.80",
      currentPrice: "35.20",
      totalInvested: "4920.00",
      currentValue: "5280.00",
      profitLoss: "360.00",
      profitLossPercent: "7.32",
    },
    {
      type: InvestmentType.stock,
      name: "Magazine Luiza",
      ticker: "MGLU3",
      institution: "Clear",
      quantity: "200",
      averagePrice: "8.50",
      currentPrice: "6.80",
      totalInvested: "1700.00",
      currentValue: "1360.00",
      profitLoss: "-340.00",
      profitLossPercent: "-20.00",
    },

    // FIIs
    {
      type: InvestmentType.fii,
      name: "HGLG11",
      ticker: "HGLG11",
      institution: "XP Investimentos",
      quantity: "50",
      averagePrice: "165.00",
      currentPrice: "172.30",
      totalInvested: "8250.00",
      currentValue: "8615.00",
      profitLoss: "365.00",
      profitLossPercent: "4.42",
    },
    {
      type: InvestmentType.fii,
      name: "XPLG11",
      ticker: "XPLG11",
      institution: "XP Investimentos",
      quantity: "80",
      averagePrice: "98.50",
      currentPrice: "102.80",
      totalInvested: "7880.00",
      currentValue: "8224.00",
      profitLoss: "344.00",
      profitLossPercent: "4.37",
    },
    {
      type: InvestmentType.fii,
      name: "MXRF11",
      ticker: "MXRF11",
      institution: "Rico",
      quantity: "100",
      averagePrice: "10.20",
      currentPrice: "10.85",
      totalInvested: "1020.00",
      currentValue: "1085.00",
      profitLoss: "65.00",
      profitLossPercent: "6.37",
    },

    // ETF
    {
      type: InvestmentType.etf,
      name: "IVVB11",
      ticker: "IVVB11",
      institution: "XP Investimentos",
      quantity: "30",
      averagePrice: "285.00",
      currentPrice: "312.50",
      totalInvested: "8550.00",
      currentValue: "9375.00",
      profitLoss: "825.00",
      profitLossPercent: "9.65",
    },

    // Crypto
    {
      type: InvestmentType.crypto,
      name: "Bitcoin",
      ticker: "BTC",
      institution: "Binance",
      quantity: "0.025",
      averagePrice: "380000.00",
      currentPrice: "520000.00",
      totalInvested: "9500.00",
      currentValue: "13000.00",
      profitLoss: "3500.00",
      profitLossPercent: "36.84",
    },
    {
      type: InvestmentType.crypto,
      name: "Ethereum",
      ticker: "ETH",
      institution: "Binance",
      quantity: "0.5",
      averagePrice: "12000.00",
      currentPrice: "18500.00",
      totalInvested: "6000.00",
      currentValue: "9250.00",
      profitLoss: "3250.00",
      profitLossPercent: "54.17",
    },

    // Renda Fixa
    {
      type: InvestmentType.cdb,
      name: "CDB Banco Inter",
      institution: "Banco Inter",
      indexer: "CDI",
      interestRate: "110",
      totalInvested: "15000.00",
      currentValue: "15890.00",
      profitLoss: "890.00",
      profitLossPercent: "5.93",
      maturityDate: new Date("2027-03-15"),
    },
    {
      type: InvestmentType.cdb,
      name: "CDB XP 120%",
      institution: "XP Investimentos",
      indexer: "CDI",
      interestRate: "120",
      totalInvested: "10000.00",
      currentValue: "10720.00",
      profitLoss: "720.00",
      profitLossPercent: "7.20",
      maturityDate: new Date("2028-06-20"),
    },
    {
      type: InvestmentType.treasury,
      name: "Tesouro Selic 2029",
      institution: "Tesouro Direto",
      indexer: "SELIC",
      interestRate: "100",
      totalInvested: "20000.00",
      currentValue: "21250.00",
      profitLoss: "1250.00",
      profitLossPercent: "6.25",
      maturityDate: new Date("2029-03-01"),
    },
    {
      type: InvestmentType.lci_lca,
      name: "LCI Banco do Brasil",
      institution: "Banco do Brasil",
      indexer: "CDI",
      interestRate: "95",
      totalInvested: "12000.00",
      currentValue: "12540.00",
      profitLoss: "540.00",
      profitLossPercent: "4.50",
      maturityDate: new Date("2026-09-15"),
    },
    {
      type: InvestmentType.savings,
      name: "Poupança Emergência",
      institution: "Nubank",
      totalInvested: "5000.00",
      currentValue: "5150.00",
      profitLoss: "150.00",
      profitLossPercent: "3.00",
    },
  ];

  for (const inv of investments) {
    const investment = await prisma.investment.create({
      data: {
        ...inv,
        userId: user.id,
      },
    });

    // Criar operações para cada investimento
    const operations = [];

    if (inv.type === InvestmentType.stock || inv.type === InvestmentType.fii || inv.type === InvestmentType.etf) {
      operations.push({
        investmentId: investment.id,
        type: "buy",
        date: new Date("2025-06-15"),
        quantity: (parseFloat(inv.quantity || "0") * 0.6).toString(),
        price: (parseFloat(inv.averagePrice || "0") * 0.95).toString(),
        total: (parseFloat(inv.totalInvested || "0") * 0.57).toString(),
        fees: "5.00",
      });
      operations.push({
        investmentId: investment.id,
        type: "buy",
        date: new Date("2025-11-20"),
        quantity: (parseFloat(inv.quantity || "0") * 0.4).toString(),
        price: (parseFloat(inv.averagePrice || "0") * 1.08).toString(),
        total: (parseFloat(inv.totalInvested || "0") * 0.43).toString(),
        fees: "5.00",
      });
    } else if (inv.type === InvestmentType.crypto) {
      operations.push({
        investmentId: investment.id,
        type: "buy",
        date: new Date("2025-08-10"),
        quantity: inv.quantity,
        price: inv.averagePrice,
        total: inv.totalInvested,
        fees: "25.00",
      });
    } else {
      operations.push({
        investmentId: investment.id,
        type: "deposit",
        date: new Date("2025-03-01"),
        total: inv.totalInvested,
      });
    }

    for (const op of operations) {
      await prisma.operation.create({ data: op });
    }
  }

  // ==================== CARTÕES DE CRÉDITO ====================
  console.log("💳 Criando cartões de crédito...");

  const cards = [
    { name: "Nubank", lastDigits: "4589", limit: "15000.00", closingDay: 3, dueDay: 10, color: "#8B5CF6" },
    { name: "Inter", lastDigits: "7823", limit: "8000.00", closingDay: 15, dueDay: 22, color: "#F97316" },
    { name: "C6 Bank", lastDigits: "1234", limit: "12000.00", closingDay: 20, dueDay: 27, color: "#1F2937" },
  ];

  for (const card of cards) {
    const creditCard = await prisma.creditCard.create({
      data: {
        ...card,
        userId: user.id,
      },
    });

    // Criar faturas para cada cartão (Jan-Abr 2026)
    const invoicesData = [
      { month: 1, year: 2026, status: InvoiceStatus.paid },
      { month: 2, year: 2026, status: InvoiceStatus.paid },
      { month: 3, year: 2026, status: InvoiceStatus.closed },
      { month: 4, year: 2026, status: InvoiceStatus.open },
    ];

    for (const invData of invoicesData) {
      const closingDate = new Date(invData.year, invData.month - 1, card.closingDay);
      const dueDate = new Date(invData.year, invData.month - 1, card.dueDay);
      if (card.dueDay < card.closingDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const invoice = await prisma.invoice.create({
        data: {
          creditCardId: creditCard.id,
          month: invData.month,
          year: invData.year,
          closingDate,
          dueDate,
          status: invData.status,
          total: "0",
          paidAmount: invData.status === InvoiceStatus.paid ? "0" : null,
        },
      });

      // Compras para cada fatura
      const purchasesByCard: Record<string, Array<{ description: string; category: string; value: number; date: Date; installments?: number }>> = {
        "Nubank": [
          { description: "Amazon - Eletrônicos", category: "Compras", value: 1200, date: new Date(invData.year, invData.month - 1, 5), installments: 6 },
          { description: "iFood", category: "Alimentação", value: 85, date: new Date(invData.year, invData.month - 1, 8) },
          { description: "Uber", category: "Transporte", value: 45, date: new Date(invData.year, invData.month - 1, 12) },
          { description: "Mercado Livre", category: "Compras", value: 350, date: new Date(invData.year, invData.month - 1, 15), installments: 3 },
          { description: "Spotify", category: "Assinaturas", value: 22, date: new Date(invData.year, invData.month - 1, 1) },
          { description: "Netflix", category: "Assinaturas", value: 40, date: new Date(invData.year, invData.month - 1, 1) },
        ],
        "Inter": [
          { description: "Posto Shell", category: "Transporte", value: 280, date: new Date(invData.year, invData.month - 1, 10) },
          { description: "Drogaria", category: "Saúde", value: 120, date: new Date(invData.year, invData.month - 1, 14) },
          { description: "Restaurante", category: "Alimentação", value: 180, date: new Date(invData.year, invData.month - 1, 18) },
          { description: "Magazine Luiza", category: "Compras", value: 800, date: new Date(invData.year, invData.month - 1, 20), installments: 4 },
        ],
        "C6 Bank": [
          { description: "Curso Udemy", category: "Educação", value: 89, date: new Date(invData.year, invData.month - 1, 3) },
          { description: "Apple - iCloud", category: "Assinaturas", value: 37, date: new Date(invData.year, invData.month - 1, 1) },
          { description: "Rappi", category: "Alimentação", value: 65, date: new Date(invData.year, invData.month - 1, 22) },
          { description: "Booking - Hotel", category: "Lazer", value: 950, date: new Date(invData.year, invData.month - 1, 25), installments: 5 },
        ],
      };

      const purchases = purchasesByCard[card.name] || [];
      let totalInvoice = 0;

      for (const purchase of purchases) {
        const installments = purchase.installments || 1;
        const installmentValue = purchase.value / installments;

        await prisma.purchase.create({
          data: {
            invoiceId: invoice.id,
            description: purchase.description,
            category: purchase.category,
            value: encryptValue(installmentValue),
            totalValue: encryptValue(purchase.value),
            date: purchase.date,
            installments,
            currentInstallment: 1,
          },
        });

        totalInvoice += installmentValue;
      }

      // Atualizar total da fatura
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total: encryptValue(totalInvoice),
          paidAmount: invData.status === InvoiceStatus.paid ? encryptValue(totalInvoice) : null,
        },
      });
    }
  }

  // ==================== ORÇAMENTOS ====================
  console.log("📊 Criando orçamentos...");

  const budgets = [
    { category: "Alimentação", limit: 1500 },
    { category: "Transporte", limit: 800 },
    { category: "Moradia", limit: 2800 },
    { category: "Lazer", limit: 600 },
    { category: "Saúde", limit: 500 },
    { category: "Compras", limit: 800 },
    { category: "Assinaturas", limit: 200 },
    { category: "Educação", limit: 300 },
  ];

  for (const budget of budgets) {
    // Orçamento fixo (month: 0, year: 0)
    await prisma.budget.create({
      data: {
        category: budget.category,
        limit: encryptValue(budget.limit),
        month: 0,
        year: 0,
        userId: user.id,
      },
    });
  }

  // ==================== DESPESAS RECORRENTES ====================
  console.log("🔄 Criando despesas recorrentes...");

  const recurringExpenses = [
    { description: "Aluguel", category: "Moradia", value: 2200, dueDay: 10 },
    { description: "Conta de Luz", category: "Moradia", value: 180, dueDay: 15 },
    { description: "Conta de Água", category: "Moradia", value: 95, dueDay: 15 },
    { description: "Internet", category: "Moradia", value: 120, dueDay: 16 },
    { description: "Academia", category: "Saúde", value: 150, dueDay: 1 },
    { description: "Netflix", category: "Assinaturas", value: 40, dueDay: 1 },
    { description: "Spotify", category: "Assinaturas", value: 22, dueDay: 1 },
    { description: "iCloud", category: "Assinaturas", value: 37, dueDay: 1 },
    { description: "Amazon Prime", category: "Assinaturas", value: 15, dueDay: 5 },
    { description: "Plano de Saúde", category: "Saúde", value: 450, dueDay: 10 },
  ];

  for (const expense of recurringExpenses) {
    await prisma.recurringExpense.create({
      data: {
        ...expense,
        value: encryptValue(expense.value),
        isActive: true,
        userId: user.id,
        lastLaunchedAt: new Date("2026-03-01"),
      },
    });
  }

  // ==================== METAS FINANCEIRAS ====================
  console.log("🎯 Criando metas financeiras...");

  const goals = [
    {
      name: "Reserva de Emergência",
      description: "6 meses de despesas fixas",
      category: GoalCategory.emergency,
      targetValue: 30000,
      currentValue: 18500,
      color: "#10B981",
      icon: "Shield",
      targetDate: new Date("2026-12-31"),
    },
    {
      name: "Viagem para Europa",
      description: "Férias de 15 dias em Portugal e Espanha",
      category: GoalCategory.travel,
      targetValue: 25000,
      currentValue: 8200,
      color: "#3B82F6",
      icon: "Plane",
      targetDate: new Date("2027-06-15"),
    },
    {
      name: "Entrada do Carro",
      description: "Entrada para financiamento do carro novo",
      category: GoalCategory.car,
      targetValue: 40000,
      currentValue: 12500,
      color: "#F59E0B",
      icon: "Car",
      targetDate: new Date("2027-12-31"),
    },
    {
      name: "Curso de Especialização",
      description: "MBA em Finanças",
      category: GoalCategory.education,
      targetValue: 15000,
      currentValue: 4800,
      color: "#8B5CF6",
      icon: "GraduationCap",
      targetDate: new Date("2027-03-01"),
    },
    {
      name: "Aposentadoria FIRE",
      description: "Independência financeira aos 45 anos",
      category: GoalCategory.retirement,
      targetValue: 2000000,
      currentValue: 125000,
      color: "#EC4899",
      icon: "TrendingUp",
      targetDate: new Date("2045-01-01"),
    },
  ];

  for (const goal of goals) {
    const financialGoal = await prisma.financialGoal.create({
      data: {
        name: goal.name,
        description: goal.description,
        category: goal.category,
        targetValue: encryptValue(goal.targetValue),
        currentValue: encryptValue(goal.currentValue),
        color: goal.color,
        icon: goal.icon,
        targetDate: goal.targetDate,
        isCompleted: false,
        userId: user.id,
      },
    });

    // Criar contribuições para cada meta
    const contributions = [
      { value: goal.currentValue * 0.3, date: new Date("2025-10-15"), notes: "Aporte inicial" },
      { value: goal.currentValue * 0.25, date: new Date("2025-12-05"), notes: "Aporte mensal" },
      { value: goal.currentValue * 0.2, date: new Date("2026-01-10"), notes: "Aporte mensal" },
      { value: goal.currentValue * 0.15, date: new Date("2026-02-08"), notes: "Aporte mensal" },
      { value: goal.currentValue * 0.1, date: new Date("2026-03-05"), notes: "Aporte mensal" },
    ];

    for (const contrib of contributions) {
      await prisma.goalContribution.create({
        data: {
          goalId: financialGoal.id,
          value: encryptValue(contrib.value),
          date: contrib.date,
          notes: contrib.notes,
        },
      });
    }
  }

  console.log("\n✅ Seed concluída com sucesso!");
  console.log("\n📧 Credenciais do usuário demo:");
  console.log("   Email: demo@cifracash.com");
  console.log("   Senha: demo123");
  console.log("\n📊 Dados criados:");
  console.log("   - 1 usuário");
  console.log("   - 15 categorias (5 receitas + 10 despesas)");
  console.log("   - 40+ transações (Jan-Mar 2026)");
  console.log("   - 7 templates de transação");
  console.log("   - 15 investimentos (ações, FIIs, ETF, crypto, renda fixa)");
  console.log("   - 3 cartões de crédito com faturas e compras");
  console.log("   - 8 orçamentos por categoria");
  console.log("   - 10 despesas recorrentes");
  console.log("   - 5 metas financeiras com contribuições");
}

main()
  .catch((e) => {
    console.error("❌ Erro na seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
