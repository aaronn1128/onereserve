// app/booking/success/page.tsx
import { createClient } from "@supabase/supabase-js";

function fmtDate(d: string) {
  return d.replaceAll("-", "/");
}
function fmtTime(t: string) {
  return t.slice(0, 5);
}

export default async function Page(props: any) {
  const searchParams = await props.searchParams;
  const bookingId = searchParams.booking_id || searchParams.id;

  if (!bookingId) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold">缺少 booking_id</h1>
        <p className="mt-2 text-gray-600">請從建立預約後的連結進入。</p>
      </main>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      id, customer_name, customer_email, booking_date, start_time, status,
      services ( name, duration_min ),
      merchants ( name )
    `
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold">找不到這筆預約</h1>
        <p className="mt-2 text-gray-600">{error?.message ?? "請確認連結是否正確。"}</p>
      </main>
    );
  }

  // ✅ 修正 services 陣列取值
  const svcName = (booking.services as any)?.[0]?.name ?? "服務";
const svcDuration = (booking.services as any)?.[0]?.duration_min ?? 60;
const merchantName = (booking.merchants as any)?.[0]?.name ?? "商家";
  const icsHref = `/api/booking/ics?id=${booking.id}`;

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">預約成功 🎉</h1>
        <p className="mt-2 text-gray-600">以下是你的預約資訊：</p>

        <ul className="mt-4 space-y-2 text-gray-800">
          <li><span className="font-medium">商家：</span>{merchantName}</li>
          <li><span className="font-medium">服務：</span>{svcName}（{svcDuration} 分鐘）</li>
          <li><span className="font-medium">時間：</span>{fmtDate(booking.booking_date)} {fmtTime(booking.start_time)}</li>
          <li><span className="font-medium">姓名：</span>{booking.customer_name}</li>
          <li><span className="font-medium">Email：</span>{booking.customer_email}</li>
          <li><span className="font-medium">狀態：</span>{booking.status}</li>
        </ul>

        <div className="mt-6 flex gap-3">
          <a
            href={icsHref}
            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            下載行事曆（.ics）
          </a>
          <a
            href="/"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            回首頁
          </a>
        </div>
      </div>
    </main>
  );
}
