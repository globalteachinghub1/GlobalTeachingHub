import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Capped so a single process can never hold more than a handful of the
  // pooler's connection slots — Supabase's session-mode pooler caps the
  // whole project at a small fixed pool, and dev-server restarts don't
  // always disconnect cleanly, so a large/unbounded pool here can exhaust
  // it after repeated restarts. idleTimeoutMillis releases unused
  // connections back to the pooler quickly instead of holding them open.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
