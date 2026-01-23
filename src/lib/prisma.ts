import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma Singleton
 * 
 * Por que singleton?
 * Em desenvolvimento, o Next.js faz hot reload frequente.
 * Sem singleton, cada reload criaria uma nova conexão com o banco,
 * eventualmente esgotando o pool de conexões.
 * 
 * A solução: armazenar o cliente no objeto global do Node.js,
 * que persiste entre hot reloads.
 */

// Extende o tipo global para incluir prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria cliente apenas se não existir
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Em desenvolvimento, salva no global
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;