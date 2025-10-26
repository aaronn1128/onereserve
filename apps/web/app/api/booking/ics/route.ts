// app/api/booking/ics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const booking_id = searchParams.get("id");

  if (!booking_id) {
    return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
  }

  // 查 booking + service 資料
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, booking_date, start_time, customer_name, customer_email,
      services ( name, duration_min )
    `)
    .eq("id", booking_id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const start = new Date(`${data.booking_date}T${data.start_time}`);
  const end = new Date(start.getTime() + ((data.services as any)?.duration_min ?? 60) * 60000);

  // 產生 ICS 內容
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OneReserve//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${data.id}@onereserve.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${(data.services as any)?.[0]?.name ?? "Service Booking"}`,
    `DESCRIPTION:Reserved by ${data.customer_name}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking_id}.ics"`,
    },
  });
}

function formatICSDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
