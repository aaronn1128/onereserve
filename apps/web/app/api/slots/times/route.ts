// app/api/slots/times/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 取得某服務在【指定日期】可預約的「開始時間」清單。
 * query: ?service_id=xxx&date=YYYY-MM-DD
 * 回傳：{ times: ["09:00", "10:30", ...] }
 *
 * 規則：
 * - 讀 slots：找出該 service 在該星期幾的可開時段（每列代表一個可預約開始時間）
 * - 讀 bookings：同日已被預約（非 cancelled）的 start_time 需要排除
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("service_id");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: "Missing service_id or date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // 算出這天是星期幾（0=Sun..6=Sat）
    const d = new Date(`${date}T00:00:00`);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const weekday = d.getDay();

    // 1) 該服務這個 weekday 的所有可選開始時間（slots）
    const { data: slotRows, error: slotErr } = await supabase
      .from("slots")
      .select("start_time")
      .eq("service_id", serviceId)
      .eq("day_of_week", weekday);

    if (slotErr) {
      return NextResponse.json(
        { error: "DB error (slots): " + slotErr.message },
        { status: 500 }
      );
    }

    const allTimes = new Set<string>(
      (slotRows ?? [])
        .map((r: any) => (r.start_time || "").toString().slice(0, 5)) // "HH:MM"
        .filter((t: string) => /^\d{2}:\d{2}$/.test(t))
    );

    if (allTimes.size === 0) {
      return NextResponse.json({ times: [] });
    }

    // 2) 把同日已被預約的開始時間排除（狀態非 cancelled）
    const { data: bookedRows, error: bookErr } = await supabase
      .from("bookings")
      .select("start_time, status")
      .eq("service_id", serviceId)
      .eq("booking_date", date) // YYYY-MM-DD
      .neq("status", "cancelled");

    if (bookErr) {
      return NextResponse.json(
        { error: "DB error (bookings): " + bookErr.message },
        { status: 500 }
      );
    }

    const booked = new Set<string>(
      (bookedRows ?? [])
        .map((r: any) => (r.start_time || "").toString().slice(0, 5))
        .filter((t: string) => /^\d{2}:\d{2}$/.test(t))
    );

    const available = [...allTimes].filter((t) => !booked.has(t));
    // 升冪排序（"HH:MM" 字串排序即可）
    available.sort();

    return NextResponse.json({ times: available });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
