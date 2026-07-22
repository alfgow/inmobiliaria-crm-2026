export const BOT_STATUS_VALUES = ["activo", "pausado", "finalizado"] as const;
export type BotStatus = (typeof BOT_STATUS_VALUES)[number];

export function isBotStatus(value: unknown): value is BotStatus {
  return (
    typeof value === "string" &&
    (BOT_STATUS_VALUES as readonly string[]).includes(value)
  );
}
