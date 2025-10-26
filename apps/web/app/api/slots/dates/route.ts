// app/api/slots/dates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/slots/dates?service_id=xxx&days=30
 * 回傳：{ dates: ["YYYY-MM-DD", ...] }
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function fmtLocalYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("service_id");
    const days = Math.max(1, Math.min(90, Number(searchParams.get("days") ?? 30)));

    if (!serviceId) {
      return NextResponse.json({ error: "Missing service_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("slots")
      .select("day_of_week")
      .eq("service_id", serviceId);

    if (error) {
      return NextResponse.json({ error: "DB error: " + error.message }, { status: 500 });
    }

    const openWeekdays = new Set<number>(
      (data ?? [])
        .map((r: any) => Number(r.day_of_week))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    );

    if (openWeekdays.size === 0) return NextResponse.json({ dates: [] });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const out: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (openWeekdays.has(d.getDay())) out.push(fmtLocalYmd(d));
    }

    return NextResponse.json({ dates: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
