import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isFixedIncome } from "@/types";
import type { CreateOperationInput, InvestmentType } from "@/types";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
} from "@/lib/cdi-history-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getAvailableBalance(userId: string): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { type: true, value: true },
  });

  let balance = 0;
  transactions.forEach((t) => {
    if (t.type === "income") {
      balance += t.value;
    } else {
      balance -= t.value;
    }
  });

  return balance;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: investmentId } = await params;
    const body: Omit<CreateOperationInput, "investmentId"> = await request.json();

    if (!body.type || !body.date) {
      return NextResponse.json(
        { error: "Tipo e data são obrigatórios" },
        { status: 400 }
      );
    }

    if (!body.price) {
      return NextResponse.json(
        { error: "Valor é obrigatório" },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        operations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    if (!investment) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    if (investment.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const isFixed = isFixedIncome(investment.type as InvestmentType);

    const dateStr = typeof body.date === "string" ? body.date : body.date.toISOString();
    const dateParts = dateStr.split("T")[0].split("-");
    const operationDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      12, 0, 0, 0
    );

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (operationDate > today) {
      return NextResponse.json(
        { error: "A data da operação não pode ser futura" },
        { status: 400 }
      );
    }

    const lastOperation = investment.operations[0];

    if (lastOperation) {
      const lastOperationDate = new Date(lastOperation.date);
      lastOperationDate.setHours(0, 0, 0, 0);
      operationDate.setHours(0, 0, 0, 0);

      if (operationDate < lastOperationDate) {
        const lastDateStr = lastOperationDate.toLocaleDateString("pt-BR");
        return NextResponse.json(
          { error: `A data da operação não pode ser anterior a ${lastDateStr} (data da última operação)` },
          { status: 400 }
        );
      }
    }

    const quantity = Number(body.quantity) || 1;
    const price = Number(body.price);
    const fees = Number(body.fees) || 0;
    const total = quantity * price + fees;

    if (body.type === "sell") {
      if (isFixed) {

        if (price > investment.currentValue) {
          return NextResponse.json(
            { error: `Valor do resgate (R$ ${price.toFixed(2)}) excede o saldo disponível (R$ ${investment.currentValue.toFixed(2)})` },
            { status: 400 }
          );
        }
      } else {

        if (quantity > investment.quantity) {
          return NextResponse.json(
            { error: `Quantidade (${quantity}) excede o disponível (${investment.quantity} cotas)` },
            { status: 400 }
          );
        }
      }
    }

    if (body.type === "buy" && !body.skipBalanceCheck) {
      const availableBalance = await getAvailableBalance(session.user.id);
      if (availableBalance < total) {
        return NextResponse.json(
          {
            error: "Saldo insuficiente",
            code: "INSUFFICIENT_BALANCE",
            availableBalance,
            required: total,
          },
          { status: 400 }
        );
      }
    }

    const operation = await prisma.operation.create({
      data: {
        investmentId,
        type: body.type,
        quantity,
        price,
        total,
        date: new Date(body.date),
        fees,
        notes: body.notes || null,
      },
    });

    if (body.type === "buy" && !body.skipBalanceCheck) {
      await prisma.transaction.create({
        data: {
          type: "expense",
          value: total,
          category: "Investimento",
          description: `${isFixed ? "Depósito" : "Compra"}: ${investment.name}`,
          date: operationDate,
          userId: session.user.id,
        },
      });
    }

    if (body.type === "sell") {
      await prisma.transaction.create({
        data: {
          type: "income",
          value: total - fees,
          category: "Investimento",
          description: `${isFixed ? "Resgate" : "Venda"}: ${investment.name}`,
          date: operationDate,
          userId: session.user.id,
        },
      });
    }

    let newQuantity: number;
    let newTotalInvested: number;
    let newAveragePrice: number;
    let currentPrice: number;
    let currentValue: number;

    if (isFixed) {

      if (body.type === "buy") {

        newTotalInvested = investment.totalInvested + total;
        currentValue = investment.currentValue + total;
      } else {

        const percentResgatado = total / investment.currentValue;
        const totalInvestidoResgatado = investment.totalInvested * percentResgatado;
        newTotalInvested = Math.max(0, investment.totalInvested - totalInvestidoResgatado);
        currentValue = Math.max(0, investment.currentValue - total);
      }

      newQuantity = 1;
      newAveragePrice = newTotalInvested;
      currentPrice = currentValue;
    } else {

      if (body.type === "buy") {

        newQuantity = investment.quantity + quantity;
        newTotalInvested = investment.totalInvested + total;
        newAveragePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
      } else {

        newQuantity = Math.max(0, investment.quantity - quantity);

        const soldValue = quantity * investment.averagePrice;
        newTotalInvested = Math.max(0, investment.totalInvested - soldValue);
        newAveragePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
      }

      currentPrice = investment.currentPrice || price;
      currentValue = newQuantity * currentPrice;
    }

    const profitLoss = currentValue - newTotalInvested;
    const profitLossPercent =
      newTotalInvested > 0 ? (profitLoss / newTotalInvested) * 100 : 0;

    let updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        quantity: newQuantity,
        averagePrice: newAveragePrice,
        totalInvested: newTotalInvested,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
      },
      include: {
        operations: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (isFixed && investment.indexer && investment.indexer !== "NA") {
      try {
        const cdiHistory = await fetchCDIHistory(1500);

        if (cdiHistory) {

          const allOperations = await prisma.operation.findMany({
            where: { investmentId },
            orderBy: { date: "asc" },
          });

          const deposits = allOperations.filter(op => op.type === "deposit" || op.type === "buy");
          const withdrawals = allOperations.filter(op => op.type === "sell" || op.type === "withdraw");

          let totalGrossValue = 0;
          let totalGrossYield = 0;
          let totalPrincipal = 0;

          for (const deposit of deposits) {
            const depositDate = new Date(deposit.date).toISOString().split("T")[0];
            const depositValue = deposit.price;

            const result = calculateFixedIncomeYield(
              depositValue,
              depositDate,
              investment.interestRate || 100,
              investment.indexer,
              cdiHistory
            );

            if (result) {
              totalGrossValue += result.grossValue;
              totalGrossYield += result.grossYield;
              totalPrincipal += depositValue;
            } else {
              totalPrincipal += depositValue;
              totalGrossValue += depositValue;
            }
          }

          let totalWithdrawals = 0;
          for (const withdrawal of withdrawals) {
            totalWithdrawals += withdrawal.price;
          }

          const finalGrossValue = totalGrossValue - totalWithdrawals;
          const effectivePrincipal = totalPrincipal - totalWithdrawals;
          const finalProfitLoss = totalGrossYield;
          const finalProfitLossPercent = effectivePrincipal > 0
            ? (finalProfitLoss / effectivePrincipal) * 100
            : 0;

          updatedInvestment = await prisma.investment.update({
            where: { id: investmentId },
            data: {
              currentValue: finalGrossValue,
              currentPrice: finalGrossValue,
              profitLoss: finalProfitLoss,
              profitLossPercent: finalProfitLossPercent,
            },
            include: {
              operations: {
                orderBy: { date: "desc" },
              },
            },
          });
        }
      } catch (yieldError) {

        console.error("Erro ao recalcular rendimento:", yieldError);
      }
    }

    return NextResponse.json(
      { operation, investment: updatedInvestment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar operação:", error);
    return NextResponse.json(
      { error: "Erro ao criar operação" },
      { status: 500 }
    );
  }
}
