/**
 * SEED DEMO - CifraCash
 *
 * Seed otimizada para gravação de vídeo demonstrativo.
 * Contém dados realistas e diversificados para mostrar todas as funcionalidades.
 *
 * Execução: npx ts-node prisma/seed-demo.ts
 */

import { PrismaClient, GoalCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ⚠️ ALTERE PARA O ID DO SEU USUÁRIO
const USER_ID = "cml8dqk1x0000qeskfc4ykxg2";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function getDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

function getDateInMonth(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);
  return new Date(year, month, safeDay, 12, 0, 0, 0);
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          🎬 CIFRACASH - SEED PARA VÍDEO DEMO             ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n");

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    console.error("❌ Usuário não encontrado:", USER_ID);
    console.log("   Altere a constante USER_ID no início do arquivo.");
    process.exit(1);
  }

  console.log(`✅ Usuário: ${user.name || user.email}`);
  console.log("");

  // ============================================================
  // LIMPEZA COMPLETA
  // ============================================================
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
  console.log("   ✓ Dados limpos\n");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // ============================================================
  // 1. CATEGORIAS
  // ============================================================
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
    { name: "Vestuário", icon: "Shirt", color: "#0EA5E9" },
    { name: "Beleza", icon: "Sparkles", color: "#F472B6" },
    { name: "Presentes", icon: "Gift", color: "#FB7185" },
    { name: "Viagem", icon: "Plane", color: "#22D3EE" },
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
    { name: "Aluguel", icon: "Home", color: "#6366F1" },
    { name: "Bônus", icon: "Award", color: "#F97316" },
    { name: "Outros", icon: "MoreHorizontal", color: "#78716C" },
  ];

  await prisma.category.createMany({
    data: expenseCategories.map(cat => ({ ...cat, type: "expense", userId: USER_ID })),
  });

  await prisma.category.createMany({
    data: incomeCategories.map(cat => ({ ...cat, type: "income", userId: USER_ID })),
  });

  console.log("   ✓ 26 categorias criadas (16 despesas + 10 receitas)\n");

  // ============================================================
  // 2. TRANSAÇÕES — 12 meses de histórico
  // ============================================================
  console.log("💰 Criando transações (12 meses)...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTransactions: any[] = [];

  // Perfil financeiro do usuário demo:
  // - Desenvolvedor sênior, salário ~R$ 12.000
  // - Freelances ocasionais (~R$ 2.000-5.000/mês)
  // - Mora em apartamento alugado (~R$ 2.800)
  // - Tem carro próprio
  // - Cachorro de estimação
  // - Gosta de tecnologia, games, viagens
  // - Investe regularmente

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    let month = currentMonth - monthOffset;
    let year = currentYear;
    while (month < 0) {
      month += 12;
      year -= 1;
    }

    const maxDay = monthOffset === 0 ? currentDay : 28;
    const isCurrentMonth = monthOffset === 0;

    // ==================== RECEITAS ====================

    // Salário principal (crescimento: promoção há 4 meses)
    const baseSalary = monthOffset >= 4 ? 10500 : 12000;
    allTransactions.push({
      type: "income",
      value: String(baseSalary + randomBetween(-50, 50)),
      category: "Salário",
      description: "Salário - TechCorp Brasil",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // VA/VR
    allTransactions.push({
      type: "income",
      value: String(1200),
      category: "Salário",
      description: "Vale Alimentação/Refeição",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // Freelance (70% dos meses)
    if (Math.random() > 0.3) {
      const freelanceCount = randomInt(1, 4);
      const freelanceProjects = [
        "Landing page para startup",
        "Sistema de agendamento",
        "App React Native",
        "API Node.js",
        "Consultoria técnica",
        "Migração para cloud",
        "Dashboard analytics",
        "E-commerce Shopify",
      ];
      for (let i = 0; i < freelanceCount; i++) {
        allTransactions.push({
          type: "income",
          value: String(randomBetween(800, 5500)),
          category: "Freelance",
          description: pickRandom(freelanceProjects),
          date: getDateInMonth(year, month, randomInt(8, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // Dividendos (mensal - FIIs e ações)
    allTransactions.push({
      type: "income",
      value: String(randomBetween(280, 680)),
      category: "Dividendos",
      description: pickRandom(["Dividendos FIIs", "Dividendos ITUB4", "Dividendos BBAS3", "JCP VALE3"]),
      date: getDateInMonth(year, month, 15),
      userId: USER_ID,
    });

    // Bônus trimestral
    if (month % 3 === 0 && Math.random() > 0.2) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(3000, 6000)),
        category: "Bônus",
        description: "Bônus trimestral TechCorp",
        date: getDateInMonth(year, month, randomInt(20, maxDay)),
        userId: USER_ID,
      });
    }

    // PLR (dezembro)
    if (month === 11) {
      allTransactions.push({
        type: "income",
        value: String(15000),
        category: "Bônus",
        description: "PLR - Participação nos Lucros",
        date: getDateInMonth(year, month, 20),
        userId: USER_ID,
      });
    }

    // 13º salário (dezembro)
    if (month === 11) {
      allTransactions.push({
        type: "income",
        value: String(12000),
        category: "Salário",
        description: "13º salário",
        date: getDateInMonth(year, month, 20),
        userId: USER_ID,
      });
    }

    // Reembolsos esporádicos
    if (Math.random() > 0.6) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(80, 800)),
        category: "Reembolso",
        description: pickRandom(["Reembolso TechCorp", "Cashback Nubank", "Devolução Amazon", "Reembolso plano saúde"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Vendas (OLX, Enjoei)
    if (Math.random() > 0.85) {
      allTransactions.push({
        type: "income",
        value: String(randomBetween(150, 1500)),
        category: "Vendas",
        description: pickRandom(["Venda OLX - eletrônico", "Venda Enjoei - roupas", "Venda FB Marketplace"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== DESPESAS FIXAS ====================

    // Aluguel
    allTransactions.push({
      type: "expense",
      value: String(2800),
      category: "Moradia",
      description: "Aluguel apartamento - Vila Madalena",
      date: getDateInMonth(year, month, 10),
      userId: USER_ID,
    });

    // Condomínio
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(580, 650)),
      category: "Moradia",
      description: "Condomínio",
      date: getDateInMonth(year, month, 15),
      userId: USER_ID,
    });

    // IPTU (parcelado jan-out)
    if (month >= 0 && month <= 9) {
      allTransactions.push({
        type: "expense",
        value: String(385),
        category: "Impostos",
        description: `IPTU 2026 - parcela ${month + 1}/10`,
        date: getDateInMonth(year, month, 10),
        userId: USER_ID,
      });
    }

    // Energia (sazonal)
    const isSummer = month === 0 || month === 1 || month === 11 || month === 2;
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(isSummer ? 280 : 160, isSummer ? 450 : 280)),
      category: "Moradia",
      description: "Enel - Conta de luz",
      date: getDateInMonth(year, month, 18),
      userId: USER_ID,
    });

    // Água
    allTransactions.push({
      type: "expense",
      value: String(randomBetween(95, 150)),
      category: "Moradia",
      description: "Sabesp - Conta de água",
      date: getDateInMonth(year, month, 22),
      userId: USER_ID,
    });

    // Gás
    if (Math.random() > 0.2) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(65, 120)),
        category: "Moradia",
        description: "Comgás",
        date: getDateInMonth(year, month, 25),
        userId: USER_ID,
      });
    }

    // Internet
    allTransactions.push({
      type: "expense",
      value: String(159.90),
      category: "Serviços",
      description: "Vivo Fibra 600mb",
      date: getDateInMonth(year, month, 20),
      userId: USER_ID,
    });

    // Celular
    allTransactions.push({
      type: "expense",
      value: String(99.90),
      category: "Serviços",
      description: "TIM Controle 25GB",
      date: getDateInMonth(year, month, 12),
      userId: USER_ID,
    });

    // ==================== ASSINATURAS ====================
    const subscriptions = [
      { desc: "Netflix Premium 4K", value: 59.90 },
      { desc: "Spotify Family", value: 34.90 },
      { desc: "Amazon Prime", value: 19.90 },
      { desc: "Disney+ Combo", value: 45.90 },
      { desc: "iCloud 200GB", value: 14.90 },
      { desc: "ChatGPT Plus", value: 104.00 },
      { desc: "GitHub Copilot", value: 50.00 },
      { desc: "Notion Plus", value: 48.00 },
      { desc: "YouTube Premium", value: 24.90 },
    ];

    for (const sub of subscriptions) {
      allTransactions.push({
        type: "expense",
        value: String(sub.value),
        category: "Assinaturas",
        description: sub.desc,
        date: getDateInMonth(year, month, randomInt(5, 12)),
        userId: USER_ID,
      });
    }

    // ==================== SAÚDE ====================

    // Academia
    allTransactions.push({
      type: "expense",
      value: String(189.90),
      category: "Saúde",
      description: "SmartFit Black",
      date: getDateInMonth(year, month, 5),
      userId: USER_ID,
    });

    // Plano de saúde
    allTransactions.push({
      type: "expense",
      value: String(589.90),
      category: "Saúde",
      description: "Bradesco Saúde",
      date: getDateInMonth(year, month, 8),
      userId: USER_ID,
    });

    // Farmácia
    const pharmacyCount = randomInt(1, 5);
    for (let i = 0; i < pharmacyCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(25, 220)),
        category: "Saúde",
        description: pickRandom(["Drogasil", "Droga Raia", "Pague Menos", "Ultrafarma"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Consultas/exames
    if (Math.random() > 0.6) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(150, 600)),
        category: "Saúde",
        description: pickRandom(["Consulta - Dr. Silva", "Exame de sangue", "Dentista", "Oftalmologista", "Dermatologista"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== ALIMENTAÇÃO ====================

    // Supermercado
    const supermarketCount = randomInt(5, 10);
    const supermarkets = ["Pão de Açúcar", "Carrefour", "St Marche", "Hirota", "Oba Hortifruti", "Zona Sul"];
    for (let i = 0; i < supermarketCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(80, 650)),
        category: "Alimentação",
        description: pickRandom(supermarkets),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Delivery
    const deliveryCount = randomInt(10, 22);
    const deliveryOptions = [
      "iFood - Japonês", "iFood - Pizza", "iFood - Hambúrguer",
      "Rappi - Sushi", "Rappi - Thai", "Uber Eats - Mexicano",
      "Zé Delivery - Cerveja", "iFood - Açaí", "iFood - Marmita fit",
    ];
    for (let i = 0; i < deliveryCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(28, 120)),
        category: "Alimentação",
        description: pickRandom(deliveryOptions),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Restaurantes
    const restaurantCount = randomInt(4, 9);
    const restaurants = [
      "Almoço - Restaurante Mani", "Jantar - Mocotó", "Happy Hour - Bar Astor",
      "Brunch - Padaria Bráz", "Rodízio - Fogo de Chão", "Jantar romântico",
      "Almoço de negócios", "Comida japonesa - Aizomê",
    ];
    for (let i = 0; i < restaurantCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(55, 280)),
        category: "Alimentação",
        description: pickRandom(restaurants),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Café
    const coffeeCount = randomInt(8, 18);
    for (let i = 0; i < coffeeCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(12, 45)),
        category: "Alimentação",
        description: pickRandom(["Starbucks", "Coffee Lab", "Isso é Café", "Padaria", "Santo Grão"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== TRANSPORTE ====================

    // Uber/99
    const uberCount = randomInt(8, 22);
    for (let i = 0; i < uberCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(15, 65)),
        category: "Transporte",
        description: pickRandom(["Uber", "Uber", "99", "Uber Comfort"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Combustível
    const gasCount = randomInt(3, 6);
    for (let i = 0; i < gasCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(200, 380)),
        category: "Transporte",
        description: pickRandom(["Shell V-Power", "Ipiranga", "BR Podium", "Ale"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Estacionamento
    const parkingCount = randomInt(3, 8);
    for (let i = 0; i < parkingCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(12, 45)),
        category: "Transporte",
        description: "Estacionamento",
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Pedágio
    if (Math.random() > 0.5) {
      const tollCount = randomInt(2, 6);
      for (let i = 0; i < tollCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(4, 22)),
          category: "Transporte",
          description: "Pedágio - Sem Parar",
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // Manutenção do carro
    if (Math.random() > 0.75) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(250, 1800)),
        category: "Transporte",
        description: pickRandom(["Revisão - concessionária", "Troca de óleo", "Pneus novos", "Alinhamento/balanceamento", "Lavagem detalhada"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== LAZER ====================
    const leisureCount = randomInt(3, 8);
    const leisureOptions = [
      "Cinema - Cinemark", "Teatro - TUCA", "Bar com amigos", "Show - Audio",
      "Parque Ibirapuera", "Museu - MASP", "Escape room", "Boliche",
      "Festival de música", "Stand-up comedy",
    ];
    for (let i = 0; i < leisureCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(40, 300)),
        category: "Lazer",
        description: pickRandom(leisureOptions),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Games
    if (Math.random() > 0.4) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(50, 400)),
        category: "Lazer",
        description: pickRandom(["Steam - jogo novo", "PlayStation Store", "Nintendo eShop", "Xbox Game Pass"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== COMPRAS ====================
    const shoppingCount = randomInt(3, 8);
    const stores = ["Amazon", "Mercado Livre", "Magazine Luiza", "Shopee", "Kabum", "Fast Shop", "Americanas"];
    for (let i = 0; i < shoppingCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(50, 800)),
        category: "Compras",
        description: pickRandom(stores),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // Compra grande (eletrônico, etc) - ocasional
    if (Math.random() > 0.85) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(1500, 5000)),
        category: "Compras",
        description: pickRandom(["MacBook Pro", "iPhone 15", "Monitor ultrawide", "Cadeira ergonômica", "PS5", "Drone DJI"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== PETS ====================
    const petCount = randomInt(1, 4);
    for (let i = 0; i < petCount; i++) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(80, 450)),
        category: "Pets",
        description: pickRandom(["Ração Golden - Bob", "Veterinário", "Banho e tosa", "Petlove", "Brinquedos pet"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== VESTUÁRIO ====================
    if (Math.random() > 0.35) {
      const clothingCount = randomInt(1, 4);
      const clothingStores = ["Reserva", "Zara", "Nike", "Adidas", "Centauro", "Renner", "Aramis"];
      for (let i = 0; i < clothingCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(90, 550)),
          category: "Vestuário",
          description: pickRandom(clothingStores),
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // ==================== BELEZA ====================
    if (Math.random() > 0.4) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(60, 180)),
        category: "Beleza",
        description: pickRandom(["Barbearia - QOD", "Corte + barba", "Skincare", "Perfumaria"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== EDUCAÇÃO ====================
    if (Math.random() > 0.45) {
      const eduCount = randomInt(1, 3);
      for (let i = 0; i < eduCount; i++) {
        allTransactions.push({
          type: "expense",
          value: String(randomBetween(35, 350)),
          category: "Educação",
          description: pickRandom(["Udemy - curso", "Alura", "Livro O'Reilly", "Curso Rocketseat", "Inglês Fluent", "Coursera"]),
          date: getDateInMonth(year, month, randomInt(1, maxDay)),
          userId: USER_ID,
        });
      }
    }

    // ==================== PRESENTES ====================
    if (Math.random() > 0.65) {
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(80, 500)),
        category: "Presentes",
        description: pickRandom(["Presente aniversário", "Presente namorada", "Amigo secreto", "Presente dia das mães"]),
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }

    // ==================== VIAGEM ====================
    if (Math.random() > 0.8) {
      const travelItems = [
        { desc: "Passagem aérea - LATAM", min: 600, max: 2500 },
        { desc: "Hotel - Booking.com", min: 400, max: 1800 },
        { desc: "Airbnb", min: 300, max: 1200 },
        { desc: "Passeio turístico", min: 100, max: 500 },
      ];
      const item = pickRandom(travelItems);
      allTransactions.push({
        type: "expense",
        value: String(randomBetween(item.min, item.max)),
        category: "Viagem",
        description: item.desc,
        date: getDateInMonth(year, month, randomInt(1, maxDay)),
        userId: USER_ID,
      });
    }
  }

  console.log(`   ✓ ${allTransactions.length} transações criadas\n`);
  await prisma.transaction.createMany({ data: allTransactions });

  // ============================================================
  // 3. TEMPLATES
  // ============================================================
  console.log("📋 Criando templates de transação...");

  const templates = [
    { name: "Almoço trabalho", description: "Almoço no escritório", category: "Alimentação", type: "expense" as const, value: "42" },
    { name: "Uber Casa", description: "Uber para casa", category: "Transporte", type: "expense" as const, value: "28" },
    { name: "Uber Trabalho", description: "Uber para o escritório", category: "Transporte", type: "expense" as const, value: "35" },
    { name: "Supermercado", description: "Compras semanais", category: "Alimentação", type: "expense" as const, value: null },
    { name: "iFood", description: "Delivery", category: "Alimentação", type: "expense" as const, value: null },
    { name: "Café", description: "Café da tarde", category: "Alimentação", type: "expense" as const, value: "22" },
    { name: "Freelance", description: "Projeto freelance", category: "Freelance", type: "income" as const, value: null },
    { name: "Gasolina", description: "Abastecimento", category: "Transporte", type: "expense" as const, value: "280" },
    { name: "Barbearia", description: "Corte + barba", category: "Beleza", type: "expense" as const, value: "85" },
    { name: "Farmácia", description: "Medicamentos", category: "Saúde", type: "expense" as const, value: null },
    { name: "Dividendos", description: "Dividendos recebidos", category: "Dividendos", type: "income" as const, value: null },
    { name: "Ração Bob", description: "Ração do cachorro", category: "Pets", type: "expense" as const, value: "185" },
  ];

  await prisma.transactionTemplate.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: templates.map(t => ({ ...t, usageCount: randomInt(8, 55), userId: USER_ID })) as any,
  });

  console.log(`   ✓ ${templates.length} templates criados\n`);

  // ============================================================
  // 4. ORÇAMENTOS
  // ============================================================
  console.log("📊 Criando orçamentos...");

  const budgets = [
    { category: "Alimentação", limit: "3200" },
    { category: "Transporte", limit: "1500" },
    { category: "Lazer", limit: "800" },
    { category: "Compras", limit: "1200" },
    { category: "Assinaturas", limit: "500" },
    { category: "Saúde", limit: "1000" },
    { category: "Vestuário", limit: "500" },
    { category: "Pets", limit: "400" },
    { category: "Educação", limit: "400" },
    { category: "Beleza", limit: "300" },
  ];

  await prisma.budget.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: budgets.map(b => ({ ...b, month: 0, year: 0, userId: USER_ID })) as any,
  });

  console.log(`   ✓ ${budgets.length} orçamentos criados\n`);

  // ============================================================
  // 5. DESPESAS RECORRENTES
  // ============================================================
  console.log("🔄 Criando despesas recorrentes...");

  const recurringExpenses = [
    { description: "Aluguel - Vila Madalena", value: "2800", category: "Moradia", dueDay: 10 },
    { description: "Condomínio", value: "620", category: "Moradia", dueDay: 15 },
    { description: "Vivo Fibra 600mb", value: "159.90", category: "Serviços", dueDay: 20 },
    { description: "TIM Controle", value: "99.90", category: "Serviços", dueDay: 12 },
    { description: "Netflix Premium", value: "59.90", category: "Assinaturas", dueDay: 8 },
    { description: "Spotify Family", value: "34.90", category: "Assinaturas", dueDay: 8 },
    { description: "Amazon Prime", value: "19.90", category: "Assinaturas", dueDay: 8 },
    { description: "Disney+ Combo", value: "45.90", category: "Assinaturas", dueDay: 10 },
    { description: "SmartFit Black", value: "189.90", category: "Saúde", dueDay: 5 },
    { description: "Bradesco Saúde", value: "589.90", category: "Saúde", dueDay: 8 },
    { description: "iCloud 200GB", value: "14.90", category: "Assinaturas", dueDay: 15 },
    { description: "ChatGPT Plus", value: "104.00", category: "Assinaturas", dueDay: 10 },
    { description: "GitHub Copilot", value: "50.00", category: "Assinaturas", dueDay: 10 },
    { description: "Notion Plus", value: "48.00", category: "Assinaturas", dueDay: 12 },
    { description: "YouTube Premium", value: "24.90", category: "Assinaturas", dueDay: 15 },
  ];

  await prisma.recurringExpense.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: recurringExpenses.map(e => ({ ...e, isActive: true, userId: USER_ID })) as any,
  });

  console.log(`   ✓ ${recurringExpenses.length} despesas recorrentes criadas\n`);

  // ============================================================
  // 6. INVESTIMENTOS
  // ============================================================
  console.log("📈 Criando investimentos...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOperations: any[] = [];

  // --- AÇÕES BRASILEIRAS ---
  const stocks = [
    { name: "Petrobras", ticker: "PETR4", institution: "XP", ops: [
      { date: 340, type: "buy", qty: 150, price: 28.50 },
      { date: 250, type: "buy", qty: 100, price: 32.80 },
      { date: 140, type: "buy", qty: 80, price: 35.50 },
      { date: 50, type: "sell", qty: 50, price: 42.00 },
    ], currentPrice: 39.80 },
    { name: "Vale", ticker: "VALE3", institution: "XP", ops: [
      { date: 320, type: "buy", qty: 80, price: 68.00 },
      { date: 180, type: "buy", qty: 60, price: 64.50 },
      { date: 70, type: "sell", qty: 30, price: 72.00 },
    ], currentPrice: 65.20 },
    { name: "Itaú Unibanco", ticker: "ITUB4", institution: "XP", ops: [
      { date: 350, type: "buy", qty: 200, price: 24.00 },
      { date: 220, type: "buy", qty: 150, price: 27.50 },
      { date: 100, type: "buy", qty: 100, price: 30.00 },
    ], currentPrice: 34.50 },
    { name: "Banco do Brasil", ticker: "BBAS3", institution: "XP", ops: [
      { date: 300, type: "buy", qty: 80, price: 42.00 },
      { date: 160, type: "buy", qty: 60, price: 48.50 },
      { date: 60, type: "buy", qty: 40, price: 53.00 },
    ], currentPrice: 56.80 },
    { name: "WEG", ticker: "WEGE3", institution: "BTG", ops: [
      { date: 280, type: "buy", qty: 60, price: 36.00 },
      { date: 130, type: "buy", qty: 40, price: 42.50 },
    ], currentPrice: 48.20 },
    { name: "Rede D'Or", ticker: "RDOR3", institution: "BTG", ops: [
      { date: 200, type: "buy", qty: 50, price: 24.00 },
      { date: 80, type: "buy", qty: 40, price: 28.00 },
    ], currentPrice: 31.50 },
    { name: "B3", ticker: "B3SA3", institution: "XP", ops: [
      { date: 240, type: "buy", qty: 120, price: 11.20 },
      { date: 100, type: "buy", qty: 80, price: 12.80 },
    ], currentPrice: 14.20 },
    { name: "Localiza", ticker: "RENT3", institution: "BTG", ops: [
      { date: 180, type: "buy", qty: 40, price: 48.00 },
      { date: 60, type: "buy", qty: 30, price: 52.50 },
    ], currentPrice: 55.80 },
  ];

  for (const stock of stocks) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of stock.ops) {
      if (op.type === "buy") {
        totalCost += op.qty * op.price;
        totalQty += op.qty;
      } else {
        totalCost -= (totalCost / totalQty) * op.qty;
        totalQty -= op.qty;
      }
    }

    const averagePrice = totalQty > 0 ? totalCost / totalQty : 0;
    const currentValue = totalQty * stock.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "stock",
        name: stock.name,
        ticker: stock.ticker,
        institution: stock.institution,
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(stock.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of stock.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type,
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(Math.round(op.qty * op.price * 0.0003 * 100) / 100),
      });
    }
  }

  // --- FIIs ---
  const fiis = [
    { name: "HGLG11", ticker: "HGLG11", institution: "XP", ops: [
      { date: 320, type: "buy", qty: 25, price: 158.00 },
      { date: 200, type: "buy", qty: 20, price: 164.00 },
      { date: 80, type: "buy", qty: 15, price: 161.00 },
    ], currentPrice: 166.50 },
    { name: "XPLG11", ticker: "XPLG11", institution: "XP", ops: [
      { date: 280, type: "buy", qty: 40, price: 94.00 },
      { date: 150, type: "buy", qty: 35, price: 99.50 },
      { date: 50, type: "buy", qty: 25, price: 101.00 },
    ], currentPrice: 104.20 },
    { name: "MXRF11", ticker: "MXRF11", institution: "XP", ops: [
      { date: 260, type: "buy", qty: 150, price: 10.20 },
      { date: 140, type: "buy", qty: 120, price: 10.55 },
      { date: 40, type: "buy", qty: 100, price: 10.38 },
    ], currentPrice: 10.62 },
    { name: "KNRI11", ticker: "KNRI11", institution: "BTG", ops: [
      { date: 300, type: "buy", qty: 25, price: 134.00 },
      { date: 160, type: "buy", qty: 20, price: 139.50 },
    ], currentPrice: 145.00 },
    { name: "VISC11", ticker: "VISC11", institution: "BTG", ops: [
      { date: 240, type: "buy", qty: 35, price: 108.00 },
      { date: 100, type: "buy", qty: 30, price: 114.50 },
    ], currentPrice: 120.80 },
    { name: "BTLG11", ticker: "BTLG11", institution: "XP", ops: [
      { date: 180, type: "buy", qty: 30, price: 97.00 },
      { date: 60, type: "buy", qty: 25, price: 102.00 },
    ], currentPrice: 107.50 },
  ];

  for (const fii of fiis) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of fii.ops) {
      totalCost += op.qty * op.price;
      totalQty += op.qty;
    }

    const averagePrice = totalCost / totalQty;
    const currentValue = totalQty * fii.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "fii",
        name: fii.name,
        ticker: fii.ticker,
        institution: fii.institution,
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(fii.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of fii.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: "buy",
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(Math.round(op.qty * op.price * 0.0003 * 100) / 100),
      });
    }
  }

  // --- CDBs ---
  const cdbs = [
    { name: "CDB Banco Inter 112% CDI", institution: "Banco Inter", deposits: [
      { date: 320, value: 8000 },
      { date: 180, value: 6000 },
      { date: 60, value: 5000 },
    ], interestRate: 112, indexer: "CDI", maturityMonths: 24 },
    { name: "CDB Nubank 100% CDI", institution: "Nubank", deposits: [
      { date: 260, value: 5000 },
      { date: 100, value: 4000 },
    ], interestRate: 100, indexer: "CDI", maturityMonths: 12 },
    { name: "CDB BTG IPCA+7%", institution: "BTG Pactual", deposits: [
      { date: 340, value: 15000 },
      { date: 150, value: 10000 },
    ], interestRate: 7, indexer: "IPCA", maturityMonths: 36 },
  ];

  for (const cdb of cdbs) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + cdb.maturityMonths);

    let totalInvested = 0;
    for (const dep of cdb.deposits) totalInvested += dep.value;

    const avgDaysHeld = cdb.deposits.reduce((acc, d) => acc + d.date, 0) / cdb.deposits.length;
    const monthlyRate = cdb.indexer === "CDI" ? 0.0098 : 0.0082;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (cdb.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "cdb",
        name: cdb.name,
        institution: cdb.institution,
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(cdb.interestRate),
        indexer: cdb.indexer,
        maturityDate,
        userId: USER_ID,
      } as any,
    });

    for (const dep of cdb.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- Tesouro Direto ---
  const treasuryData = [
    { name: "Tesouro Selic 2029", indexer: "SELIC", rate: 100, deposits: [
      { date: 350, value: 8000 },
      { date: 200, value: 6000 },
      { date: 80, value: 5000 },
    ], maturity: new Date(2029, 2, 1) },
    { name: "Tesouro IPCA+ 2035", indexer: "IPCA", rate: 6.8, deposits: [
      { date: 280, value: 12000 },
      { date: 120, value: 8000 },
    ], maturity: new Date(2035, 5, 15) },
  ];

  for (const treasury of treasuryData) {
    let totalInvested = 0;
    for (const dep of treasury.deposits) totalInvested += dep.value;

    const avgDaysHeld = treasury.deposits.reduce((acc, d) => acc + d.date, 0) / treasury.deposits.length;
    const monthlyRate = treasury.indexer === "SELIC" ? 0.0098 : 0.0085;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + monthlyRate * (treasury.rate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "treasury",
        name: treasury.name,
        institution: "Tesouro Direto",
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(treasury.rate),
        indexer: treasury.indexer,
        maturityDate: treasury.maturity,
        userId: USER_ID,
      } as any,
    });

    for (const dep of treasury.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- LCI/LCA ---
  const lciLca = [
    { name: "LCI Banco Inter 96% CDI", type: "lci_lca", institution: "Banco Inter", deposits: [
      { date: 220, value: 10000 },
    ], interestRate: 96, indexer: "CDI", maturityMonths: 12 },
    { name: "LCA BTG 93% CDI", type: "lci_lca", institution: "BTG Pactual", deposits: [
      { date: 160, value: 12000 },
    ], interestRate: 93, indexer: "CDI", maturityMonths: 12 },
  ];

  for (const item of lciLca) {
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + item.maturityMonths);

    let totalInvested = 0;
    for (const dep of item.deposits) totalInvested += dep.value;

    const avgDaysHeld = item.deposits.reduce((acc, d) => acc + d.date, 0) / item.deposits.length;
    const monthsHeld = avgDaysHeld / 30;
    const currentValue = totalInvested * Math.pow(1 + 0.0098 * (item.interestRate / 100), monthsHeld);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "lci_lca",
        name: item.name,
        institution: item.institution,
        totalInvested: String(totalInvested),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        interestRate: String(item.interestRate),
        indexer: item.indexer,
        maturityDate,
        userId: USER_ID,
      } as any,
    });

    for (const dep of item.deposits) {
      allOperations.push({
        investmentId: investment.id,
        type: "deposit",
        quantity: String(1),
        price: String(dep.value),
        total: String(dep.value),
        date: getDate(dep.date),
        fees: String(0),
      });
    }
  }

  // --- Cripto ---
  const cryptos = [
    { name: "Bitcoin", ticker: "BTC", institution: "Binance", ops: [
      { date: 340, type: "buy", qty: 0.03, price: 160000 },
      { date: 220, type: "buy", qty: 0.04, price: 190000 },
      { date: 100, type: "buy", qty: 0.025, price: 215000 },
      { date: 40, type: "sell", qty: 0.015, price: 230000 },
    ], currentPrice: 210000 },
    { name: "Ethereum", ticker: "ETH", institution: "Binance", ops: [
      { date: 280, type: "buy", qty: 0.5, price: 11000 },
      { date: 160, type: "buy", qty: 0.6, price: 13000 },
      { date: 60, type: "buy", qty: 0.4, price: 15000 },
    ], currentPrice: 14500 },
    { name: "Solana", ticker: "SOL", institution: "Binance", ops: [
      { date: 160, type: "buy", qty: 10, price: 140 },
      { date: 60, type: "buy", qty: 15, price: 175 },
    ], currentPrice: 200 },
  ];

  for (const crypto of cryptos) {
    let totalQty = 0;
    let totalCost = 0;

    for (const op of crypto.ops) {
      if (op.type === "buy") {
        totalCost += op.qty * op.price;
        totalQty += op.qty;
      } else {
        totalCost -= (totalCost / totalQty) * op.qty;
        totalQty -= op.qty;
      }
    }

    const averagePrice = totalQty > 0 ? totalCost / totalQty : 0;
    const currentValue = totalQty * crypto.currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const investment = await prisma.investment.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        type: "crypto",
        name: crypto.name,
        ticker: crypto.ticker,
        institution: crypto.institution,
        quantity: String(totalQty),
        averagePrice: String(averagePrice),
        currentPrice: String(crypto.currentPrice),
        totalInvested: String(totalCost),
        currentValue: String(currentValue),
        profitLoss: String(profitLoss),
        profitLossPercent: String(profitLossPercent),
        userId: USER_ID,
      } as any,
    });

    for (const op of crypto.ops) {
      allOperations.push({
        investmentId: investment.id,
        type: op.type,
        quantity: String(op.qty),
        price: String(op.price),
        total: String(op.qty * op.price),
        date: getDate(op.date),
        fees: String(Math.round(op.qty * op.price * 0.001 * 100) / 100),
      });
    }
  }

  console.log(`   ✓ ${stocks.length + fiis.length + cdbs.length + treasuryData.length + lciLca.length + cryptos.length} investimentos criados`);
  console.log(`   ✓ ${allOperations.length} operações criadas\n`);
  await prisma.operation.createMany({ data: allOperations });

  // ============================================================
  // 7. CARTÕES DE CRÉDITO
  // ============================================================
  console.log("💳 Criando cartões de crédito...");

  const nubank = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "Nubank Ultravioleta",
      lastDigits: "8421",
      limit: "25000",
      closingDay: 3,
      dueDay: 10,
      color: "#8B5CF6",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const xp = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "XP Visa Infinite",
      lastDigits: "7654",
      limit: "35000",
      closingDay: 8,
      dueDay: 15,
      color: "#10B981",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const inter = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "Inter Black",
      lastDigits: "5673",
      limit: "15000",
      closingDay: 15,
      dueDay: 22,
      color: "#F97316",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const c6 = await prisma.creditCard.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      name: "C6 Carbon",
      lastDigits: "3190",
      limit: "18000",
      closingDay: 20,
      dueDay: 27,
      color: "#1F2937",
      isActive: true,
      userId: USER_ID,
    } as any,
  });

  const cards = [
    { card: nubank, avgSpend: 5500 },
    { card: xp, avgSpend: 4500 },
    { card: inter, avgSpend: 2800 },
    { card: c6, avgSpend: 3200 },
  ];

  const purchaseCategories = [
    { category: "Alimentação", descriptions: ["iFood", "Rappi", "Outback", "Pão de Açúcar", "Starbucks", "McDonald's", "Burger King", "Subway"], minValue: 20, maxValue: 400 },
    { category: "Compras", descriptions: ["Amazon", "Mercado Livre", "Magazine Luiza", "Kabum", "Shopee", "Fast Shop", "Casas Bahia"], minValue: 50, maxValue: 1200 },
    { category: "Transporte", descriptions: ["Uber", "99", "Shell", "Ipiranga", "Sem Parar", "Estacionamento"], minValue: 15, maxValue: 350 },
    { category: "Lazer", descriptions: ["Cinemark", "Steam", "PlayStation Store", "Ingresso.com", "Spotify", "Netflix"], minValue: 20, maxValue: 300 },
    { category: "Assinaturas", descriptions: ["Spotify", "Netflix", "Disney+", "HBO Max", "Amazon Prime", "YouTube Premium"], minValue: 15, maxValue: 80 },
    { category: "Viagem", descriptions: ["Booking.com", "Airbnb", "LATAM", "GOL", "Azul", "Hotel Ibis"], minValue: 250, maxValue: 3000 },
    { category: "Vestuário", descriptions: ["Reserva", "Zara", "Nike", "Adidas", "Renner", "C&A"], minValue: 100, maxValue: 700 },
    { category: "Saúde", descriptions: ["Drogasil", "Droga Raia", "Pague Menos", "Farmácia"], minValue: 30, maxValue: 400 },
    { category: "Educação", descriptions: ["Udemy", "Alura", "Amazon Livros", "Coursera"], minValue: 35, maxValue: 250 },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPurchases: any[] = [];
  const invoiceUpdates: Array<{ id: string; total: number }> = [];

  for (const { card, avgSpend } of cards) {
    // 12 meses de faturas
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      let month = currentMonth - monthOffset;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }

      const closingDate = new Date(year, month, card.closingDay);
      const dueDate = new Date(year, month, card.dueDay);

      let status: "open" | "closed" | "paid" | "overdue" = "paid";
      if (monthOffset === 0) status = "open";
      else if (monthOffset === 1) status = "closed";
      // Uma fatura vencida para demonstrar alertas
      else if (monthOffset === 2 && card === inter) status = "overdue";

      const paidAmount = status === "paid" ? String(avgSpend * randomBetween(0.85, 1.15)) : String(0);

      const invoice = await prisma.invoice.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          creditCardId: card.id,
          month: month + 1,
          year,
          closingDate,
          dueDate,
          status,
          total: String(0),
          paidAmount,
        } as any,
      });

      let invoiceTotal = 0;
      const purchaseCount = randomInt(12, 28);

      for (let i = 0; i < purchaseCount; i++) {
        const catInfo = pickRandom(purchaseCategories);
        const description = pickRandom(catInfo.descriptions);
        const value = randomBetween(catInfo.minValue, catInfo.maxValue);

        const isInstallment = Math.random() > 0.72;
        const installments = isInstallment ? pickRandom([2, 3, 4, 5, 6, 8, 10, 12]) : 1;
        const installmentValue = Math.round((value / installments) * 100) / 100;

        allPurchases.push({
          invoiceId: invoice.id,
          description,
          value: String(installmentValue),
          totalValue: String(value),
          category: catInfo.category,
          date: getDateInMonth(year, month, randomInt(1, 28)),
          installments,
          currentInstallment: 1,
        });

        invoiceTotal += installmentValue;
      }

      invoiceUpdates.push({ id: invoice.id, total: invoiceTotal });
    }
  }

  console.log(`   ✓ 4 cartões criados`);
  console.log(`   ✓ ${allPurchases.length} compras criadas\n`);

  await prisma.purchase.createMany({ data: allPurchases });

  for (const update of invoiceUpdates) {
    await prisma.invoice.update({
      where: { id: update.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { total: String(update.total) } as any,
    });
  }

  // ============================================================
  // 8. METAS FINANCEIRAS
  // ============================================================
  console.log("🎯 Criando metas financeiras...");

  const goals: Array<{
    name: string;
    description: string;
    category: GoalCategory;
    targetValue: number;
    currentValue: number;
    targetDate: Date;
    color: string;
    icon: string;
    contributions: number;
  }> = [
    {
      name: "Reserva de Emergência",
      description: "6 meses de despesas - proteção financeira total",
      category: GoalCategory.emergency,
      targetValue: 50000,
      currentValue: 38500,
      targetDate: new Date(currentYear + 1, 5, 30),
      color: "#10B981",
      icon: "Shield",
      contributions: 14,
    },
    {
      name: "Viagem Japão 2028",
      description: "3 semanas no Japão - Tokyo, Kyoto, Osaka, Hakone",
      category: GoalCategory.travel,
      targetValue: 45000,
      currentValue: 18200,
      targetDate: new Date(2028, 3, 1),
      color: "#3B82F6",
      icon: "Plane",
      contributions: 10,
    },
    {
      name: "Entrada Apartamento",
      description: "20% de entrada para financiar apê em Pinheiros",
      category: GoalCategory.house,
      targetValue: 220000,
      currentValue: 62000,
      targetDate: new Date(currentYear + 4, 0, 1),
      color: "#EC4899",
      icon: "Home",
      contributions: 18,
    },
    {
      name: "Troca do Carro",
      description: "Upgrade para um SUV - Creta ou HRV",
      category: GoalCategory.car,
      targetValue: 75000,
      currentValue: 28500,
      targetDate: new Date(currentYear + 2, 6, 1),
      color: "#F97316",
      icon: "Car",
      contributions: 12,
    },
    {
      name: "MBA em Engenharia de Software",
      description: "Pós-graduação na FIAP ou Insper",
      category: GoalCategory.education,
      targetValue: 55000,
      currentValue: 12800,
      targetDate: new Date(currentYear + 1, 7, 1),
      color: "#8B5CF6",
      icon: "GraduationCap",
      contributions: 7,
    },
    {
      name: "Aposentadoria Antecipada",
      description: "FIRE - Financial Independence, Retire Early aos 50",
      category: GoalCategory.retirement,
      targetValue: 750000,
      currentValue: 58000,
      targetDate: new Date(currentYear + 18, 0, 1),
      color: "#6366F1",
      icon: "TrendingUp",
      contributions: 16,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allContributions: any[] = [];

  for (const goalData of goals) {
    const goal = await prisma.financialGoal.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        name: goalData.name,
        description: goalData.description,
        category: goalData.category,
        targetValue: String(goalData.targetValue),
        currentValue: String(goalData.currentValue),
        targetDate: goalData.targetDate,
        color: goalData.color,
        icon: goalData.icon,
        userId: USER_ID,
      } as any,
    });

    const avgContribution = goalData.currentValue / goalData.contributions;
    for (let i = 0; i < goalData.contributions; i++) {
      const contribValue = avgContribution * randomBetween(0.65, 1.35);
      allContributions.push({
        goalId: goal.id,
        value: String(Math.round(contribValue * 100) / 100),
        date: getDate(i * 26 + randomInt(0, 12)),
        notes: i === 0
          ? "Aporte inicial"
          : Math.random() > 0.7
            ? pickRandom(["Bônus do mês", "Sobra do mês", "Freelance extra", "PLR", "13º salário"])
            : null,
      });
    }
  }

  console.log(`   ✓ ${goals.length} metas criadas`);
  console.log(`   ✓ ${allContributions.length} contribuições criadas\n`);

  await prisma.goalContribution.createMany({ data: allContributions });

  // ============================================================
  // RESUMO FINAL
  // ============================================================
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ SEED CONCLUÍDO                      ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  📁 Categorias:                26                        ║`);
  console.log(`║  💰 Transações:                ${String(allTransactions.length).padEnd(24)}║`);
  console.log(`║  📋 Templates:                 ${String(templates.length).padEnd(24)}║`);
  console.log(`║  📊 Orçamentos:                ${String(budgets.length).padEnd(24)}║`);
  console.log(`║  🔄 Despesas Recorrentes:      ${String(recurringExpenses.length).padEnd(24)}║`);
  console.log(`║  📈 Investimentos:             ${String(stocks.length + fiis.length + cdbs.length + treasuryData.length + lciLca.length + cryptos.length).padEnd(24)}║`);
  console.log(`║  📉 Operações:                 ${String(allOperations.length).padEnd(24)}║`);
  console.log(`║  💳 Cartões:                   4                         ║`);
  console.log(`║  🛒 Compras:                   ${String(allPurchases.length).padEnd(24)}║`);
  console.log(`║  🎯 Metas:                     ${String(goals.length).padEnd(24)}║`);
  console.log(`║  💵 Contribuições:             ${String(allContributions.length).padEnd(24)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n");
  console.log("🎬 Dados prontos para gravação do vídeo!");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
