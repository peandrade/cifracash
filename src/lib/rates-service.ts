/**
 * Serviço de Taxas de Juros
 *
 * Busca taxas atuais do Banco Central do Brasil
 * API gratuita: https://dadosabertos.bcb.gov.br/
 *
 * Códigos das séries:
 * - 12: CDI (Taxa DI anualizada)
 * - 432: SELIC Meta (% a.a.)
 * - 433: IPCA (Variação % mensal)
 */

export interface RateResult {
  code: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  error?: string;
}

export interface AllRates {
  cdi: RateResult | null;
  selic: RateResult | null;
  ipca: RateResult | null;
  lastUpdate: Date;
}

// Códigos das séries do BCB
const RATE_CODES = {
  CDI: "12",      // Taxa DI anualizada
  SELIC: "432",  // Meta SELIC
  IPCA: "433",   // IPCA mensal
};

// Cache simples
let ratesCache: AllRates | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em ms

/**
 * Busca uma série específica do BCB
 */
async function fetchBCBSeries(code: string): Promise<RateResult | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Erro ao buscar série ${code}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const latest = data[0];

    return {
      code,
      name: getSeriesName(code),
      value: parseFloat(latest.valor),
      date: latest.data,
      unit: getSeriesUnit(code),
    };
  } catch (error) {
    console.error(`Erro ao buscar série ${code}:`, error);
    return null;
  }
}

/**
 * Retorna o nome da série
 */
function getSeriesName(code: string): string {
  switch (code) {
    case RATE_CODES.CDI:
      return "CDI";
    case RATE_CODES.SELIC:
      return "SELIC";
    case RATE_CODES.IPCA:
      return "IPCA";
    default:
      return "Desconhecido";
  }
}

/**
 * Retorna a unidade da série
 */
function getSeriesUnit(code: string): string {
  switch (code) {
    case RATE_CODES.CDI:
      return "% a.a.";
    case RATE_CODES.SELIC:
      return "% a.a.";
    case RATE_CODES.IPCA:
      return "% a.m.";
    default:
      return "%";
  }
}

/**
 * Verifica se o cache ainda é válido
 */
function isCacheValid(): boolean {
  if (!ratesCache) return false;
  return Date.now() - ratesCache.lastUpdate.getTime() < CACHE_DURATION;
}

/**
 * Busca todas as taxas
 */
export async function fetchAllRates(): Promise<AllRates> {
  // Verifica cache
  if (isCacheValid() && ratesCache) {
    console.log("[Rates] Usando cache");
    return ratesCache;
  }

  console.log("[Rates] Buscando taxas do BCB...");

  // Busca em paralelo
  const [cdi, selic, ipca] = await Promise.all([
    fetchBCBSeries(RATE_CODES.CDI),
    fetchBCBSeries(RATE_CODES.SELIC),
    fetchBCBSeries(RATE_CODES.IPCA),
  ]);

  const result: AllRates = {
    cdi,
    selic,
    ipca,
    lastUpdate: new Date(),
  };

  // Salva no cache
  ratesCache = result;

  return result;
}

/**
 * Busca uma taxa específica
 */
export async function fetchRate(type: "CDI" | "SELIC" | "IPCA"): Promise<RateResult | null> {
  const code = RATE_CODES[type];
  return fetchBCBSeries(code);
}

/**
 * Limpa o cache
 */
export function clearRatesCache() {
  ratesCache = null;
}

/**
 * Calcula o rendimento estimado baseado na taxa e indexador
 * @param principal - Valor investido
 * @param rate - Taxa contratada (ex: 100 para 100% CDI, 5 para IPCA+5%)
 * @param indexer - Tipo de indexador
 * @param currentRates - Taxas atuais
 * @param days - Número de dias
 */
export function calculateEstimatedReturn(
  principal: number,
  rate: number,
  indexer: string,
  currentRates: AllRates,
  days: number = 365
): { grossReturn: number; annualRate: number } {
  // Se não há indexador, não calcula rendimento
  if (indexer === "NA") {
    return { grossReturn: 0, annualRate: 0 };
  }

  let annualRate = 0;

  switch (indexer) {
    case "CDI":
      // rate% do CDI
      if (currentRates.cdi) {
        annualRate = (rate / 100) * currentRates.cdi.value;
      }
      break;
    case "IPCA":
      // IPCA + rate%
      if (currentRates.ipca) {
        // Converter IPCA mensal para anual aproximado
        const ipcaAnual = Math.pow(1 + currentRates.ipca.value / 100, 12) - 1;
        annualRate = (ipcaAnual * 100) + rate;
      }
      break;
    case "SELIC":
      // SELIC + rate%
      if (currentRates.selic) {
        annualRate = currentRates.selic.value + rate;
      }
      break;
    case "PREFIXADO":
      // Taxa fixa
      annualRate = rate;
      break;
    default:
      annualRate = rate;
  }

  // Calcula rendimento bruto (simplificado, sem considerar IR)
  const dailyRate = annualRate / 365 / 100;
  const grossReturn = principal * Math.pow(1 + dailyRate, days) - principal;

  return { grossReturn, annualRate };
}

/**
 * Formata a descrição da taxa
 */
export function formatRateDescription(rate: number | null, indexer: string | null): string {
  if (indexer === "NA") return "N/A";
  if (!rate || !indexer) return "-";

  switch (indexer) {
    case "CDI":
      return `${rate}% do CDI`;
    case "IPCA":
      return `IPCA + ${rate}%`;
    case "SELIC":
      return `SELIC + ${rate}%`;
    case "PREFIXADO":
      return `${rate}% a.a.`;
    default:
      return `${rate}%`;
  }
}
