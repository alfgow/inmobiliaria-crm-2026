import { Prisma } from "../../app/generated/prisma/client";

export function isDatabaseUnavailableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P1001"
  );
}
