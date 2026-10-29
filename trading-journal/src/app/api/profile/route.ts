import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"] as const;
const timezoneSchema = z.string().trim().min(1).max(80).refine((timezone) => {
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); return true; }
  catch { return false; }
}, "Choose a valid timezone.");
const preferencesSchema = z.object({
  preMarketRoutine: z.object({
    enabled: z.boolean(), showOnAllPages: z.boolean(), startSessionPrompt: z.boolean(), autoHideOnComplete: z.boolean(), resetTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    steps: z.array(z.object({ id: z.string().min(1).max(40), icon: z.enum(["calendar", "plan", "meditation", "charts", "custom"]), title: z.string().trim().min(1).max(80), action: z.enum(["news", "edge", "sanctuary", "trading", "none"]) })).min(1).max(6),
  }).optional(),
  phoneNumber: z.string().trim().max(32).regex(/^[\d\s().-]*$/).refine((value) => value.replace(/\D/g, "").length >= 4 || value.length === 0, "Enter a valid phone number.").nullable().optional(),
  phoneCountryCode: z.string().regex(/^\+[1-9]\d{0,3}$/).optional(),
  phoneRegion: z.string().regex(/^[A-Z]{2}$/).optional(),
  timezone: timezoneSchema.optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  currencyDisplay: z.enum(currencies).nullable().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  avatarData: z.string().max(420_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable().optional(),
}).strict();

async function userId() {
  const { data: session } = await auth.getSession();
  return session?.user?.id ?? null;
}

export async function GET() {
  try {
    const id = await userId();
    if (!id) return NextResponse.json({ error: "Please sign in to view your profile." }, { status: 401 });
    const rows = await sql`SELECT phone_number, phone_country_code, phone_region, timezone, time_format, currency_display, theme, avatar_data, pre_market_routine FROM user_profile_settings WHERE user_id = ${id} LIMIT 1`;
    const row = rows[0];
    return NextResponse.json({
      phoneNumber: row?.phone_number ?? "",
      phoneCountryCode: row?.phone_country_code ?? "+1",
      phoneRegion: row?.phone_region ?? "US",
      timezone: row?.timezone ?? "Europe/Paris",
      timeFormat: row?.time_format ?? "24h",
      currencyDisplay: row?.currency_display ?? "",
      theme: row?.theme ?? "dark",
      avatarData: row?.avatar_data ?? null,
      preMarketRoutine: row?.pre_market_routine ?? null,
    });
  } catch (error) {
    console.error("[profile] Failed to load settings", error);
    return NextResponse.json({ error: "Couldn’t load your profile settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = await userId();
    if (!id) return NextResponse.json({ error: "Please sign in to update your profile." }, { status: 401 });
    const parsed = preferencesSchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      return NextResponse.json({ error: "Choose a valid profile setting to update." }, { status: 400 });
    }
    const currentRows = await sql`SELECT phone_number, phone_country_code, phone_region, timezone, time_format, currency_display, theme, avatar_data, pre_market_routine FROM user_profile_settings WHERE user_id = ${id} LIMIT 1`;
    const current = currentRows[0];
    const values = {
      phoneNumber: parsed.data.phoneNumber === undefined ? current?.phone_number ?? null : parsed.data.phoneNumber?.trim() || null,
      phoneCountryCode: parsed.data.phoneCountryCode ?? current?.phone_country_code ?? "+1",
      phoneRegion: parsed.data.phoneRegion ?? current?.phone_region ?? "US",
      timezone: parsed.data.timezone ?? current?.timezone ?? "Europe/Paris",
      timeFormat: parsed.data.timeFormat ?? current?.time_format ?? "24h",
      currencyDisplay: parsed.data.currencyDisplay === undefined ? current?.currency_display ?? null : parsed.data.currencyDisplay,
      theme: parsed.data.theme ?? current?.theme ?? "dark",
      avatarData: parsed.data.avatarData === undefined ? current?.avatar_data ?? null : parsed.data.avatarData,
      preMarketRoutine: parsed.data.preMarketRoutine === undefined ? current?.pre_market_routine ?? null : parsed.data.preMarketRoutine,
    };
    await sql`INSERT INTO user_profile_settings (user_id, phone_number, phone_country_code, phone_region, timezone, time_format, currency_display, theme, avatar_data, pre_market_routine, updated_at)
      VALUES (${id}, ${values.phoneNumber}, ${values.phoneCountryCode}, ${values.phoneRegion}, ${values.timezone}, ${values.timeFormat}, ${values.currencyDisplay}, ${values.theme}, ${values.avatarData}, ${values.preMarketRoutine}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET phone_number = EXCLUDED.phone_number, phone_country_code = EXCLUDED.phone_country_code, phone_region = EXCLUDED.phone_region, timezone = EXCLUDED.timezone,
      time_format = EXCLUDED.time_format, currency_display = EXCLUDED.currency_display, theme = EXCLUDED.theme, avatar_data = EXCLUDED.avatar_data, pre_market_routine = EXCLUDED.pre_market_routine, updated_at = NOW()`;
    return NextResponse.json({ ...values, phoneNumber: values.phoneNumber ?? "", currencyDisplay: values.currencyDisplay ?? "" });
  } catch (error) {
    console.error("[profile] Failed to save settings", error);
    return NextResponse.json({ error: "Couldn’t save your profile settings." }, { status: 500 });
  }
}
