// app/api/book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const isYMD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isHM  = (s: string) => /^\d{2}:\d{2}$/.test(s);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const customer_name  = (body?.customer_name ?? "").trim();
    const customer_email = (body?.customer_email ?? "").trim();
    const service_id     = (body?.service_id ?? "").trim();
    const booking_date   = (body?.date ?? "").trim();   // YYYY-MM-DD
    const start_time_hm  = (body?.time ?? "").trim();   // HH:MM

    if (!customer_name || !customer_email || !service_id || !isYMD(booking_date) || !isHM(start_time_hm)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const start_time = start_time_hm + ":00";

    // 0) 先抓服務，取 merchant_id / name / duration_min
    const { data: svc, error: svcErr } = await supabase
      .from("services")
      .select("id, name, duration_min, merchant_id")
      .eq("id", service_id)
      .single();

    if (svcErr || !svc) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 1) 檢查該日期是否為可預約星期且有該開始時間
    const weekday = new Date(`${booking_date}T00:00:00`).getDay(); // 0..6
    const { data: slotRows, error: slotErr } = await supabase
      .from("slots")
      .select("id")
      .eq("service_id", service_id)
      .eq("day_of_week", weekday)
      .eq("start_time", start_time);

    if (slotErr) return NextResponse.json({ error: "DB error (slots): " + slotErr.message }, { status: 500 });
    if (!slotRows || slotRows.length === 0) {
      return NextResponse.json({ error: "Slot not available" }, { status: 409 });
    }

    // 2) 撞單檢查
    const { data: booked, error: bookedErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("service_id", service_id)
      .eq("booking_date", booking_date)
      .eq("start_time", start_time)
      .neq("status", "cancelled")
      .limit(1);

    if (bookedErr) return NextResponse.json({ error: "DB error (bookings check): " + bookedErr.message }, { status: 500 });
    if (booked && booked.length > 0) {
      return NextResponse.json({ error: "Time already booked" }, { status: 409 });
    }

    // 3) 寫入 booking（重點：帶上 merchant_id）
    const { data: inserted, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        customer_name,
        customer_email,
        merchant_id: svc.merchant_id,   // <—— 這行解決 NOT NULL
        service_id,
        booking_date,
        start_time,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (insertErr) return NextResponse.json({ error: "DB error (insert): " + insertErr.message }, { status: 500 });

    const booking_id = inserted.id as string;

    // 4) 寄信（失敗不擋流程）
    try {
      if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const subject = `OneReserve 確認：${svc.name} - ${booking_date} ${start_time_hm}`;
        const html = `
          <div>
            <p>Hi ${customer_name}，您的預約已成立：</p>
            <ul>
              <li>服務：${svc.name}</li>
              <li>日期：${booking_date}</li>
              <li>時間：${start_time_hm}</li>
              <li>時長：${svc.duration_min ?? 60} 分鐘</li>
            </ul>
          </div>
        `;

        // 順帶通知商家（若有 email）
const { data: merchant, error: merErr } = await supabase
  .from("merchants")
  .select("name, contact_email")
  .eq("id", svc.merchant_id)
  .single();

const merchantTo = merchant?.contact_email ? [merchant.contact_email] : [];

await resend.emails.send({
  from: process.env.FROM_EMAIL!,
  to: [customer_email, ...merchantTo],
  subject,
  html,
});
      }
    } catch (_) {}

    return NextResponse.json({ booking_id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
