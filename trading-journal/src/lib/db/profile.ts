import { sql } from "@/lib/db";

export type UserPreferences = {
  timezone: string;
  timeFormat: "12h" | "24h";
  currencyDisplay: string;
  theme: "light" | "dark" | "system";
};

const defaults: UserPreferences = {
  timezone: "Europe/Paris",
  timeFormat: "24h",
  currencyDisplay: "",
  theme: "dark",
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const rows = await sql`SELECT timezone, time_format, currency_display, theme FROM user_profile_settings WHERE user_id = ${userId} LIMIT 1`;
  const row = rows[0];
  return {
    timezone: row?.timezone ?? defaults.timezone,
    timeFormat: row?.time_format === "12h" ? "12h" : "24h",
    currencyDisplay: String(row?.currency_display ?? "").trim(),
    theme: row?.theme === "light" || row?.theme === "system" ? row.theme : "dark",
  };
}
