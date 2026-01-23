/**
 * Serviço de Histórico do CDI
 *
 * Busca a série histórica do CDI do Banco Central para cálculo
 * preciso de rendimentos de renda fixa.
 *
 * API: https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados
 * Série 12 = Taxa CDI diária (% a.d.)
 */

export interface CDIHistoryEntry {
  date: string; // formato DD/MM/YYYY do BCB
  dateISO: string; // formato YYYY-MM-DD
  rate: number; // taxa diária em %
}

export interface CDIHistory {
  entries: CDIHistoryEntry[];
  startDate: string;
  endDate: string;
  lastUpdate: Date;
}

// Cache do histórico
let historyCache: CDIHistory | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

/**
 * Converte data do formato BCB (DD/MM/YYYY) para ISO (YYYY-MM-DD)
 */
function bcbDateToISO(bcbDate: string): string {
  const [day, month, year] = bcbDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Converte data ISO para Date objeto (meia-noite UTC-3)
 */
function isoToDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Busca histórico do CDI do BCB
 * @param days - Número de dias para buscar (padrão: 365)
 */
export async function fetchCDIHistory(days: number = 365): Promise<CDIHistory | null> {
  // Verifica cache
  if (historyCache && Date.now() - historyCache.lastUpdate.getTime() < CACHE_DURATION) {
    console.log("[CDI History] Usando cache");
    return historyCache;
  }

  try {
    console.log(`[CDI History] Buscando histórico do CDI...`);

    // API do BCB permite máximo 20 valores por requisição
    // Vamos usar a API com intervalo de datas em vez de "últimos N"
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = `${String(startDate.getDate()).padStart(2, "0")}/${String(startDate.getMonth() + 1).padStart(2, "0")}/${startDate.getFullYear()}`;
    const endStr = `${String(endDate.getDate()).padStart(2, "0")}/${String(endDate.getMonth() + 1).padStart(2, "0")}/${endDate.getFullYear()}`;

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startStr}&dataFinal=${endStr}`;

    console.log(`[CDI History] URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[CDI History] Erro HTTP: ${response.status}`);
      return createFallbackHistory(days);
    }

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[CDI History] Erro ao fazer parse do JSON:", parseError);
      return createFallbackHistory(days);
    }

    // Verifica se é um array válido
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("[CDI History] Resposta inválida:", data);
      return createFallbackHistory(days);
    }

    const entries: CDIHistoryEntry[] = data.map((item: { data: string; valor: string }) => ({
      date: item.data,
      dateISO: bcbDateToISO(item.data),
      rate: parseFloat(item.valor),
    }));

    const history: CDIHistory = {
      entries,
      startDate: entries[0].dateISO,
      endDate: entries[entries.length - 1].dateISO,
      lastUpdate: new Date(),
    };

    historyCache = history;
    console.log(`[CDI History] Carregado: ${entries.length} dias úteis (${history.startDate} a ${history.endDate})`);

    return history;
  } catch (error) {
    console.error("[CDI History] Erro ao buscar:", error);

    // Fallback: criar histórico estimado com taxa fixa
    console.log("[CDI History] Usando fallback com taxa estimada...");
    return createFallbackHistory(days);
  }
}

/**
 * Cria um histórico de fallback quando a API do BCB não está disponível
 * Usa uma taxa média estimada do CDI
 */
function createFallbackHistory(days: number): CDIHistory {
  const CDI_DAILY_RATE = 0.055; // ~14.25% a.a. convertido para taxa diária aproximada
  const entries: CDIHistoryEntry[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Pula fins de semana
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateISO = date.toISOString().split("T")[0];
    const dateBR = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

    entries.push({
      date: dateBR,
      dateISO,
      rate: CDI_DAILY_RATE,
    });
  }

  return {
    entries,
    startDate: entries[0]?.dateISO || "",
    endDate: entries[entries.length - 1]?.dateISO || "",
    lastUpdate: new Date(),
  };
}

/**
 * Verifica se uma data é dia útil (existe no histórico do CDI)
 */
export function isBusinessDay(dateISO: string, history: CDIHistory): boolean {
  return history.entries.some(e => e.dateISO === dateISO);
}

/**
 * Obtém a taxa CDI de um dia específico
 */
export function getCDIRate(dateISO: string, history: CDIHistory): number | null {
  const entry = history.entries.find(e => e.dateISO === dateISO);
  return entry ? entry.rate : null;
}

/**
 * Tabela de IOF regressivo (dias corridos)
 * IOF sobre rendimento: começa em 96% e vai a 0% após 30 dias
 */
const IOF_TABLE: number[] = [
  96, 93, 90, 86, 83, 80, 76, 73, 70, 66, // dias 1-10
  63, 60, 56, 53, 50, 46, 43, 40, 36, 33, // dias 11-20
  30, 26, 23, 20, 16, 13, 10, 6, 3, 0,    // dias 21-30
];

/**
 * Calcula IOF baseado nos dias corridos
 */
export function calculateIOF(daysCorridos: number): number {
  if (daysCorridos >= 30) return 0;
  if (daysCorridos < 1) return 96;
  return IOF_TABLE[daysCorridos - 1];
}

/**
 * Tabela de IR regressivo (dias corridos)
 */
export function calculateIR(daysCorridos: number): number {
  if (daysCorridos <= 180) return 22.5;
  if (daysCorridos <= 360) return 20;
  if (daysCorridos <= 720) return 17.5;
  return 15;
}

/**
 * Interface para resultado do cálculo
 */
export interface YieldCalculationResult {
  grossValue: number;        // Valor bruto atual
  grossYield: number;        // Rendimento bruto
  grossYieldPercent: number; // Rendimento bruto %
  iofAmount: number;         // Valor do IOF
  iofPercent: number;        // Alíquota IOF
  irAmount: number;          // Valor do IR
  irPercent: number;         // Alíquota IR
  netValue: number;          // Valor líquido
  netYield: number;          // Rendimento líquido
  netYieldPercent: number;   // Rendimento líquido %
  businessDays: number;      // Dias úteis de rendimento
  calendarDays: number;      // Dias corridos
  dailyRates: { date: string; rate: number; accumulated: number }[]; // Debug
}

/**
 * Calcula o rendimento de um investimento de renda fixa
 *
 * @param principal - Valor investido
 * @param startDate - Data do investimento (ISO: YYYY-MM-DD)
 * @param contractedRate - Taxa contratada (ex: 100 para 100% CDI)
 * @param indexer - Tipo de indexador (CDI, IPCA, SELIC, PREFIXADO)
 * @param history - Histórico do CDI
 */
export function calculateFixedIncomeYield(
  principal: number,
  startDate: string,
  contractedRate: number,
  indexer: string,
  history: CDIHistory
): YieldCalculationResult | null {
  if (!principal || principal <= 0) return null;
  if (!startDate) return null;
  if (indexer === "NA") return null;

  const start = isoToDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Dias corridos
  const calendarDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (calendarDays < 0) {
    // Data futura
    return {
      grossValue: principal,
      grossYield: 0,
      grossYieldPercent: 0,
      iofAmount: 0,
      iofPercent: 0,
      irAmount: 0,
      irPercent: 0,
      netValue: principal,
      netYield: 0,
      netYieldPercent: 0,
      businessDays: 0,
      calendarDays: 0,
      dailyRates: [],
    };
  }

  // Filtra dias úteis no período
  const relevantDays = history.entries.filter(e => {
    const entryDate = isoToDate(e.dateISO);
    return entryDate >= start && entryDate <= today;
  });

  // Calcula rendimento acumulado
  let accumulated = principal;
  const dailyRates: { date: string; rate: number; accumulated: number }[] = [];

  for (const day of relevantDays) {
    let dailyRate = 0;

    switch (indexer) {
      case "CDI":
        // contractedRate% do CDI diário
        dailyRate = (contractedRate / 100) * (day.rate / 100);
        break;
      case "SELIC":
        // SELIC é praticamente igual ao CDI + spread
        // Usamos CDI como proxy + taxa adicional anualizada
        const selicDailySpread = contractedRate / 252 / 100;
        dailyRate = (day.rate / 100) + selicDailySpread;
        break;
      case "IPCA":
        // IPCA + taxa prefixada
        // IPCA é mensal, então aproximamos diariamente
        // Usamos o CDI como proxy de rendimento base + spread
        const ipcaDailySpread = contractedRate / 252 / 100;
        dailyRate = (day.rate / 100) * 0.9 + ipcaDailySpread; // aproximação
        break;
      case "PREFIXADO":
        // Taxa fixa anual convertida para diária
        dailyRate = contractedRate / 252 / 100;
        break;
      default:
        dailyRate = day.rate / 100;
    }

    accumulated = accumulated * (1 + dailyRate);
    dailyRates.push({
      date: day.dateISO,
      rate: dailyRate * 100,
      accumulated,
    });
  }

  const grossYield = accumulated - principal;
  const grossYieldPercent = (grossYield / principal) * 100;

  // Calcula impostos
  const iofPercent = calculateIOF(calendarDays);
  const iofAmount = grossYield * (iofPercent / 100);

  const yieldAfterIOF = grossYield - iofAmount;

  const irPercent = calculateIR(calendarDays);
  const irAmount = yieldAfterIOF * (irPercent / 100);

  const netYield = grossYield - iofAmount - irAmount;
  const netValue = principal + netYield;
  const netYieldPercent = (netYield / principal) * 100;

  return {
    grossValue: accumulated,
    grossYield,
    grossYieldPercent,
    iofAmount,
    iofPercent,
    irAmount,
    irPercent,
    netValue,
    netYield,
    netYieldPercent,
    businessDays: relevantDays.length,
    calendarDays,
    dailyRates,
  };
}

/**
 * Limpa o cache do histórico
 */
export function clearCDIHistoryCache() {
  historyCache = null;
}
