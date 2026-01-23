import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "cmkqcday50002qewcd7yriqx2";

function getDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getDateInMonth(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

async function main() {
  console.log("🌱 Iniciando seed para o usuário:", USER_ID);

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", USER_ID);
    return;
  }

  console.log("✅ Usuário encontrado:", user.name || user.email);

  console.log("🧹 Limpando dados existentes...");
  await prisma.goalContribution.deleteMany({ where: { goal: { userId: USER_ID } } });
  await prisma.financialGoal.deleteMany({ where: { userId: USER_ID } });
  await prisma.purchase.deleteMany({ where: { invoice: { creditCard: { userId: USER_ID } } } });
  await prisma.invoice.deleteMany({ where: { creditCard: { userId: USER_ID } } });
  await prisma.creditCard.deleteMany({ where: { userId: USER_ID } });
  await prisma.operation.deleteMany({ where: { investment: { userId: USER_ID } } });
  await prisma.investment.deleteMany({ where: { userId: USER_ID } });
  await prisma.recurringExpense.deleteMany({ where: { userId: USER_ID } });
  await prisma.budget.deleteMany({ where: { userId: USER_ID } });
  await prisma.transactionTemplate.deleteMany({ where: { userId: USER_ID } });
  await prisma.transaction.deleteMany({ where: { userId: USER_ID } });
  await prisma.category.deleteMany({ where: { userId: USER_ID } });

  console.log("📁 Criando categorias...");

  const expenseCategories = [
    { name: "Alimentação", icon: "Utensils", color: "#F97316" },
    { name: "Transporte", icon: "Car", color: "#3B82F6" },
    { name: "Moradia", icon: "Home", color: "#8B5CF6" },
    { name: "Saúde", icon: "Heart", color: "#EF4444" },
    { name: "Educação", icon: "GraduationCap", color: "#10B981" },
    { name: "Lazer", icon: "Gamepad2", color: "#EC4899" },
    { name: "Compras", icon: "ShoppingBag", color: "#F59E0B" },
    { name: "Serviços", icon: "Wrench", color: "#6366F1" },
    { name: "Assinaturas", icon: "CreditCard", color: "#14B8A6" },
    { name: "Pets", icon: "PawPrint", color: "#A855F7" },
    { name: "Impostos", icon: "Receipt", color: "#64748B" },
    { name: "Outros", icon: "MoreHorizontal", color: "#78716C" },
  ];

  const incomeCategories = [
    { name: "Salário", icon: "Wallet", color: "#10B981" },
    { name: "Freelance", icon: "Laptop", color: "#3B82F6" },
    { name: "Investimentos", icon: "TrendingUp", color: "#8B5CF6" },
    { name: "Dividendos", icon: "Coins", color: "#F59E0B" },
    { name: "Vendas", icon: "Store", color: "#EC4899" },
    { name: "Presente", icon: "Gift", color: "#EF4444" },
    { name: "Reembolso", icon: "RotateCcw", color: "#14B8A6" },
    { name: "Outros", icon: "MoreHorizontal", color: "#78716C" },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.create({
      data: { ...cat, type: "expense", userId: USER_ID },
    });
  }

  for (const cat of incomeCategories) {
    await prisma.category.create({
      data: { ...cat, type: "income", userId: USER_ID },
    });
  }

  console.log("💰 Criando transações...");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = currentMonth - monthOffset;
    const year = month < 0 ? currentYear - 1 : currentYear;
    const actualMonth = month < 0 ? month + 12 : month;

    await prisma.transaction.create({
      data: {
        type: "income",
        value: 8500 + Math.random() * 500,
        category: "Salário",
        description: "Salário mensal",
        date: getDateInMonth(year, actualMonth, 5),
        userId: USER_ID,
      },
    });

    if (Math.random() > 0.5) {
      await prisma.transaction.create({
        data: {
          type: "income",
          value: 1500 + Math.random() * 2000,
          category: "Freelance",
          description: "Projeto freelance",
          date: getDateInMonth(year, actualMonth, 15 + Math.floor(Math.random() * 10)),
          userId: USER_ID,
        },
      });
    }

    if (Math.random() > 0.3) {
      await prisma.transaction.create({
        data: {
          type: "income",
          value: 200 + Math.random() * 300,
          category: "Dividendos",
          description: "Dividendos FIIs",
          date: getDateInMonth(year, actualMonth, 15),
          userId: USER_ID,
        },
      });
    }

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 2200,
        category: "Moradia",
        description: "Aluguel do apartamento",
        date: getDateInMonth(year, actualMonth, 10),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 450,
        category: "Moradia",
        description: "Taxa de condomínio",
        date: getDateInMonth(year, actualMonth, 15),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 129.90,
        category: "Serviços",
        description: "Internet fibra 500mb",
        date: getDateInMonth(year, actualMonth, 20),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 79.90,
        category: "Serviços",
        description: "Plano de celular",
        date: getDateInMonth(year, actualMonth, 12),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 180 + Math.random() * 80,
        category: "Moradia",
        description: "Conta de luz",
        date: getDateInMonth(year, actualMonth, 18),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 85 + Math.random() * 30,
        category: "Moradia",
        description: "Conta de água",
        date: getDateInMonth(year, actualMonth, 22),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 55.90,
        category: "Assinaturas",
        description: "Netflix",
        date: getDateInMonth(year, actualMonth, 8),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 21.90,
        category: "Assinaturas",
        description: "Spotify Premium",
        date: getDateInMonth(year, actualMonth, 8),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 34.90,
        category: "Assinaturas",
        description: "Amazon Prime",
        date: getDateInMonth(year, actualMonth, 8),
        userId: USER_ID,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "expense",
        value: 149.90,
        category: "Saúde",
        description: "Academia Smart Fit",
        date: getDateInMonth(year, actualMonth, 5),
        userId: USER_ID,
      },
    });

    const supermarketCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < supermarketCount; i++) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 150 + Math.random() * 350,
          category: "Alimentação",
          description: ["Supermercado Extra", "Carrefour", "Pão de Açúcar", "Assaí"][Math.floor(Math.random() * 4)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    const deliveryCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < deliveryCount; i++) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 35 + Math.random() * 80,
          category: "Alimentação",
          description: ["iFood", "Rappi", "Uber Eats"][Math.floor(Math.random() * 3)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    const restaurantCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < restaurantCount; i++) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 80 + Math.random() * 150,
          category: "Alimentação",
          description: ["Almoço", "Jantar", "Happy Hour"][Math.floor(Math.random() * 3)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    const transportCount = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < transportCount; i++) {
      const isUber = Math.random() > 0.4;
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: isUber ? 15 + Math.random() * 45 : 150 + Math.random() * 100,
          category: "Transporte",
          description: isUber ? "Uber" : "Combustível",
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    if (Math.random() > 0.3) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 50 + Math.random() * 150,
          category: "Saúde",
          description: "Drogaria",
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    const leisureCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < leisureCount; i++) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 30 + Math.random() * 150,
          category: "Lazer",
          description: ["Cinema", "Teatro", "Bar", "Show", "Parque"][Math.floor(Math.random() * 5)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    if (Math.random() > 0.4) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 80 + Math.random() * 400,
          category: "Compras",
          description: ["Amazon", "Mercado Livre", "Magazine Luiza", "Shopee"][Math.floor(Math.random() * 4)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }

    if (Math.random() > 0.5) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: 100 + Math.random() * 200,
          category: "Pets",
          description: ["Ração", "Veterinário", "Pet shop"][Math.floor(Math.random() * 3)],
          date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
          userId: USER_ID,
        },
      });
    }
  }

  console.log("📋 Criando templates...");

  const templates = [
    { name: "Almoço", description: "Almoço na empresa", category: "Alimentação", type: "expense" as const, value: 35 },
    { name: "Uber Casa", description: "Uber para casa", category: "Transporte", type: "expense" as const, value: 25 },
    { name: "Uber Trabalho", description: "Uber para o trabalho", category: "Transporte", type: "expense" as const, value: 28 },
    { name: "Supermercado", description: "Compras do mês", category: "Alimentação", type: "expense" as const, value: null },
    { name: "iFood", description: null, category: "Alimentação", type: "expense" as const, value: null },
    { name: "Freelance", description: "Projeto freelance", category: "Freelance", type: "income" as const, value: null },
    { name: "Pix Recebido", description: null, category: "Outros", type: "income" as const, value: null },
  ];

  for (const template of templates) {
    await prisma.transactionTemplate.create({
      data: {
        ...template,
        usageCount: Math.floor(Math.random() * 20),
        userId: USER_ID,
      },
    });
  }

  console.log("📊 Criando orçamentos...");

  const budgets = [
    { category: "Alimentação", limit: 2000 },
    { category: "Transporte", limit: 800 },
    { category: "Lazer", limit: 500 },
    { category: "Compras", limit: 600 },
    { category: "Assinaturas", limit: 200 },
    { category: "Saúde", limit: 400 },
  ];

  for (const budget of budgets) {
    await prisma.budget.create({
      data: {
        ...budget,
        month: 0,
        year: 0,
        userId: USER_ID,
      },
    });
  }

  console.log("🔄 Criando despesas recorrentes...");

  const recurringExpenses = [
    { description: "Aluguel", value: 2200, category: "Moradia", dueDay: 10 },
    { description: "Condomínio", value: 450, category: "Moradia", dueDay: 15 },
    { description: "Internet", value: 129.90, category: "Serviços", dueDay: 20 },
    { description: "Celular", value: 79.90, category: "Serviços", dueDay: 12 },
    { description: "Netflix", value: 55.90, category: "Assinaturas", dueDay: 8 },
    { description: "Spotify", value: 21.90, category: "Assinaturas", dueDay: 8 },
    { description: "Amazon Prime", value: 34.90, category: "Assinaturas", dueDay: 8 },
    { description: "Academia Smart Fit", value: 149.90, category: "Saúde", dueDay: 5 },
    { description: "iCloud 200GB", value: 14.90, category: "Assinaturas", dueDay: 15 },
  ];

  for (const expense of recurringExpenses) {
    await prisma.recurringExpense.create({
      data: {
        ...expense,
        isActive: true,
        userId: USER_ID,
      },
    });
  }

  console.log("📈 Criando investimentos...");

  const stocks = [
    { name: "Petrobras", ticker: "PETR4", quantity: 200, averagePrice: 35.50, currentPrice: 38.20 },
    { name: "Vale", ticker: "VALE3", quantity: 100, averagePrice: 68.00, currentPrice: 62.50 },
    { name: "Itaú Unibanco", ticker: "ITUB4", quantity: 150, averagePrice: 28.50, currentPrice: 32.80 },
    { name: "Banco do Brasil", ticker: "BBAS3", quantity: 80, averagePrice: 45.00, currentPrice: 52.30 },
    { name: "WEG", ticker: "WEGE3", quantity: 50, averagePrice: 38.00, currentPrice: 42.50 },
  ];

  for (const stock of stocks) {
    const totalInvested = stock.quantity * stock.averagePrice;
    const currentValue = stock.quantity * stock.currentPrice;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "stock",
        name: stock.name,
        ticker: stock.ticker,
        institution: "XP Investimentos",
        quantity: stock.quantity,
        averagePrice: stock.averagePrice,
        currentPrice: stock.currentPrice,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    await prisma.operation.create({
      data: {
        investmentId: investment.id,
        type: "buy",
        quantity: stock.quantity,
        price: stock.averagePrice,
        total: totalInvested,
        date: getDate(Math.floor(Math.random() * 180) + 30),
        fees: totalInvested * 0.0003,
      },
    });
  }

  const fiis = [
    { name: "HGLG11", ticker: "HGLG11", quantity: 30, averagePrice: 165.00, currentPrice: 158.50 },
    { name: "XPLG11", ticker: "XPLG11", quantity: 50, averagePrice: 98.00, currentPrice: 102.30 },
    { name: "MXRF11", ticker: "MXRF11", quantity: 100, averagePrice: 10.50, currentPrice: 10.20 },
    { name: "KNRI11", ticker: "KNRI11", quantity: 25, averagePrice: 142.00, currentPrice: 138.00 },
    { name: "VISC11", ticker: "VISC11", quantity: 40, averagePrice: 115.00, currentPrice: 118.50 },
  ];

  for (const fii of fiis) {
    const totalInvested = fii.quantity * fii.averagePrice;
    const currentValue = fii.quantity * fii.currentPrice;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "fii",
        name: fii.name,
        ticker: fii.ticker,
        institution: "XP Investimentos",
        quantity: fii.quantity,
        averagePrice: fii.averagePrice,
        currentPrice: fii.currentPrice,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    await prisma.operation.create({
      data: {
        investmentId: investment.id,
        type: "buy",
        quantity: fii.quantity,
        price: fii.averagePrice,
        total: totalInvested,
        date: getDate(Math.floor(Math.random() * 180) + 30),
        fees: totalInvested * 0.0003,
      },
    });
  }

  const cdbs = [
    { name: "CDB Banco Inter 110% CDI", institution: "Banco Inter", totalInvested: 10000, interestRate: 110, indexer: "CDI", maturityMonths: 24 },
    { name: "CDB Nubank 100% CDI", institution: "Nubank", totalInvested: 5000, interestRate: 100, indexer: "CDI", maturityMonths: 12 },
    { name: "CDB BTG IPCA+6%", institution: "BTG Pactual", totalInvested: 15000, interestRate: 6, indexer: "IPCA", maturityMonths: 36 },
  ];

  for (const cdb of cdbs) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + cdb.maturityMonths);

    const monthsHeld = Math.floor(Math.random() * 12) + 1;
    const monthlyRate = cdb.indexer === "CDI" ? 0.01 : 0.008;
    const currentValue = cdb.totalInvested * Math.pow(1 + monthlyRate * (cdb.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - cdb.totalInvested;
    const profitLossPercent = (profitLoss / cdb.totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "cdb",
        name: cdb.name,
        institution: cdb.institution,
        totalInvested: cdb.totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        interestRate: cdb.interestRate,
        indexer: cdb.indexer,
        maturityDate,
        userId: USER_ID,
      },
    });

    await prisma.operation.create({
      data: {
        investmentId: investment.id,
        type: "deposit",
        quantity: 1,
        price: cdb.totalInvested,
        total: cdb.totalInvested,
        date: getDate(monthsHeld * 30),
        fees: 0,
      },
    });
  }

  const treasuryInvestment = await prisma.investment.create({
    data: {
      type: "treasury",
      name: "Tesouro Selic 2029",
      institution: "Tesouro Direto",
      totalInvested: 8000,
      currentValue: 8450,
      profitLoss: 450,
      profitLossPercent: 5.625,
      interestRate: 100,
      indexer: "SELIC",
      maturityDate: new Date(2029, 0, 1),
      userId: USER_ID,
    },
  });

  await prisma.operation.create({
    data: {
      investmentId: treasuryInvestment.id,
      type: "deposit",
      quantity: 1,
      price: 8000,
      total: 8000,
      date: getDate(180),
      fees: 0,
    },
  });

  const cryptos = [
    { name: "Bitcoin", ticker: "BTC", quantity: 0.05, averagePrice: 180000, currentPrice: 195000 },
    { name: "Ethereum", ticker: "ETH", quantity: 0.5, averagePrice: 12000, currentPrice: 13500 },
  ];

  for (const crypto of cryptos) {
    const totalInvested = crypto.quantity * crypto.averagePrice;
    const currentValue = crypto.quantity * crypto.currentPrice;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      data: {
        type: "crypto",
        name: crypto.name,
        ticker: crypto.ticker,
        institution: "Binance",
        quantity: crypto.quantity,
        averagePrice: crypto.averagePrice,
        currentPrice: crypto.currentPrice,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPercent,
        userId: USER_ID,
      },
    });

    await prisma.operation.create({
      data: {
        investmentId: investment.id,
        type: "buy",
        quantity: crypto.quantity,
        price: crypto.averagePrice,
        total: totalInvested,
        date: getDate(Math.floor(Math.random() * 90) + 30),
        fees: totalInvested * 0.001,
      },
    });
  }

  console.log("💳 Criando cartões de crédito...");

  const nubank = await prisma.creditCard.create({
    data: {
      name: "Nubank",
      lastDigits: "4532",
      limit: 15000,
      closingDay: 3,
      dueDay: 10,
      color: "#8B5CF6",
      isActive: true,
      userId: USER_ID,
    },
  });

  const inter = await prisma.creditCard.create({
    data: {
      name: "Banco Inter",
      lastDigits: "7891",
      limit: 8000,
      closingDay: 15,
      dueDay: 22,
      color: "#F97316",
      isActive: true,
      userId: USER_ID,
    },
  });

  const c6 = await prisma.creditCard.create({
    data: {
      name: "C6 Bank",
      lastDigits: "2468",
      limit: 12000,
      closingDay: 20,
      dueDay: 27,
      color: "#1F2937",
      isActive: true,
      userId: USER_ID,
    },
  });

  const cards = [
    { card: nubank, avgSpend: 3500 },
    { card: inter, avgSpend: 1500 },
    { card: c6, avgSpend: 2000 },
  ];

  for (const { card, avgSpend } of cards) {
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const month = currentMonth - monthOffset;
      const year = month < 0 ? currentYear - 1 : currentYear;
      const actualMonth = month < 0 ? month + 12 : month;

      const closingDate = new Date(year, actualMonth, card.closingDay);
      const dueDate = new Date(year, actualMonth, card.dueDay);

      const invoice = await prisma.invoice.create({
        data: {
          creditCardId: card.id,
          month: actualMonth + 1,
          year,
          closingDate,
          dueDate,
          status: monthOffset === 0 ? "open" : monthOffset === 1 ? "closed" : "paid",
          total: 0,
          paidAmount: monthOffset === 2 ? avgSpend * (0.9 + Math.random() * 0.2) : 0,
        },
      });

      const purchaseCategories = [
        { category: "Alimentação", descriptions: ["iFood", "Rappi", "Restaurante", "Supermercado"], minValue: 30, maxValue: 300 },
        { category: "Compras", descriptions: ["Amazon", "Mercado Livre", "Magazine Luiza", "AliExpress"], minValue: 50, maxValue: 500 },
        { category: "Transporte", descriptions: ["Uber", "99", "Combustível Shell"], minValue: 20, maxValue: 200 },
        { category: "Lazer", descriptions: ["Ingresso.com", "Steam", "PlayStation Store", "Cinema"], minValue: 30, maxValue: 200 },
        { category: "Assinaturas", descriptions: ["Spotify", "Netflix", "Disney+", "HBO Max"], minValue: 20, maxValue: 60 },
      ];

      let invoiceTotal = 0;
      const purchaseCount = 8 + Math.floor(Math.random() * 8);

      for (let i = 0; i < purchaseCount; i++) {
        const catInfo = purchaseCategories[Math.floor(Math.random() * purchaseCategories.length)];
        const description = catInfo.descriptions[Math.floor(Math.random() * catInfo.descriptions.length)];
        const value = catInfo.minValue + Math.random() * (catInfo.maxValue - catInfo.minValue);

        const isInstallment = Math.random() > 0.7;
        const installments = isInstallment ? [2, 3, 4, 6, 10, 12][Math.floor(Math.random() * 6)] : 1;
        const installmentValue = value / installments;

        await prisma.purchase.create({
          data: {
            invoiceId: invoice.id,
            description,
            value: installmentValue,
            totalValue: value,
            category: catInfo.category,
            date: getDateInMonth(year, actualMonth, Math.floor(Math.random() * 28) + 1),
            installments,
            currentInstallment: 1,
          },
        });

        invoiceTotal += installmentValue;
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { total: invoiceTotal },
      });
    }
  }

  console.log("🎯 Criando metas financeiras...");

  const emergencyGoal = await prisma.financialGoal.create({
    data: {
      name: "Reserva de Emergência",
      description: "6 meses de despesas",
      category: "emergency",
      targetValue: 30000,
      currentValue: 18500,
      targetDate: new Date(currentYear + 1, 5, 30),
      color: "#10B981",
      userId: USER_ID,
    },
  });

  for (let i = 0; i < 8; i++) {
    await prisma.goalContribution.create({
      data: {
        goalId: emergencyGoal.id,
        value: 2000 + Math.random() * 500,
        date: getDate(i * 30 + Math.floor(Math.random() * 10)),
        notes: i === 0 ? "Início da reserva" : null,
      },
    });
  }

  const travelGoal = await prisma.financialGoal.create({
    data: {
      name: "Viagem Europa",
      description: "Férias de 15 dias na Europa",
      category: "travel",
      targetValue: 25000,
      currentValue: 8200,
      targetDate: new Date(currentYear + 1, 10, 15),
      color: "#3B82F6",
      userId: USER_ID,
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.goalContribution.create({
      data: {
        goalId: travelGoal.id,
        value: 1500 + Math.random() * 500,
        date: getDate(i * 30 + Math.floor(Math.random() * 10)),
      },
    });
  }

  const carGoal = await prisma.financialGoal.create({
    data: {
      name: "Troca do Carro",
      description: "Entrada para um carro novo",
      category: "car",
      targetValue: 50000,
      currentValue: 12000,
      targetDate: new Date(currentYear + 2, 0, 1),
      color: "#F97316",
      userId: USER_ID,
    },
  });

  for (let i = 0; i < 4; i++) {
    await prisma.goalContribution.create({
      data: {
        goalId: carGoal.id,
        value: 2500 + Math.random() * 1000,
        date: getDate(i * 45 + Math.floor(Math.random() * 15)),
      },
    });
  }

  const educationGoal = await prisma.financialGoal.create({
    data: {
      name: "MBA",
      description: "Pós-graduação em Gestão",
      category: "education",
      targetValue: 35000,
      currentValue: 5000,
      targetDate: new Date(currentYear + 1, 1, 1),
      color: "#8B5CF6",
      userId: USER_ID,
    },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.goalContribution.create({
      data: {
        goalId: educationGoal.id,
        value: 1500 + Math.random() * 500,
        date: getDate(i * 30 + Math.floor(Math.random() * 10)),
      },
    });
  }

  const houseGoal = await prisma.financialGoal.create({
    data: {
      name: "Entrada Apartamento",
      description: "20% de entrada para financiamento",
      category: "house",
      targetValue: 150000,
      currentValue: 22000,
      targetDate: new Date(currentYear + 4, 0, 1),
      color: "#EC4899",
      userId: USER_ID,
    },
  });

  for (let i = 0; i < 6; i++) {
    await prisma.goalContribution.create({
      data: {
        goalId: houseGoal.id,
        value: 3000 + Math.random() * 1500,
        date: getDate(i * 30 + Math.floor(Math.random() * 10)),
      },
    });
  }

  console.log("");
  console.log("✅ Seed concluído com sucesso!");
  console.log("");
  console.log("📊 Resumo dos dados criados:");
  console.log("   • Categorias: 20 (12 despesas + 8 receitas)");
  console.log("   • Transações: ~180 (6 meses de histórico)");
  console.log("   • Templates: 7");
  console.log("   • Orçamentos: 6");
  console.log("   • Despesas Recorrentes: 9");
  console.log("   • Investimentos: 15 (ações, FIIs, CDBs, Tesouro, Cripto)");
  console.log("   • Cartões de Crédito: 3 (com faturas e compras)");
  console.log("   • Metas Financeiras: 5 (com contribuições)");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
