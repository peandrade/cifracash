import { NextResponse } from "next/server";
import { fetchAllRates } from "@/lib/rates-service";

export async function GET() {
  try {
    const rates = await fetchAllRates();

    return NextResponse.json({
      success: true,
      rates: {
        cdi: rates.cdi,
        selic: rates.selic,
        ipca: rates.ipca,
      },
      lastUpdate: rates.lastUpdate,
    });
  } catch (error) {
    console.error("Erro ao buscar taxas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar taxas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
