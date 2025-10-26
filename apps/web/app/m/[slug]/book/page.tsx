"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Service = { id: string; name: string; duration_min: number };

// ⬇️ 用 react 的 use() 解包 params（不要 async、不要再宣告第二個 slug）
export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // 1) 取商家 + 服務（用 slug）
  useEffect(() => {
    (async () => {
      // merchants: 用 slug 找商家
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res1 = await fetch(`${url}/rest/v1/merchants?slug=eq.${slug}&select=id,name`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      const [merchant] = await res1.json();
      if (!merchant) return;

      setMerchantName(merchant.name);

      // services: 列出此商家的所有服務
      const res2 = await fetch(
        `${url}/rest/v1/services?merchant_id=eq.${merchant.id}&select=id,name,duration_min`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
      );
      const list = await res2.json();
      setServices(list);
      if (list?.[0]?.id) setServiceId(list[0].id);
    })();
  }, [slug]);

  // 2) 選到 service 後，抓可預約日期
  useEffect(() => {
    if (!serviceId) return;
    setDate(""); setTime(""); setTimes([]); setDates([]);
    (async () => {
      const r = await fetch(`/api/slots/dates?service_id=${serviceId}`);
      const j = await r.json();
      setDates(j.dates ?? []);
    })();
  }, [serviceId]);

  // 3) 選到日期後，抓時段
  useEffect(() => {
    if (!serviceId || !date) return;
    setTime(""); setTimes([]);
    (async () => {
      const r = await fetch(`/api/slots/times?service_id=${serviceId}&date=${date}`);
      const j = await r.json();
      setTimes(j.times ?? []);
    })();
  }, [serviceId, date]);

  const canSubmit = useMemo(() => {
    return !!(name && email && serviceId && date && time);
  }, [name, email, serviceId, date, time]);

  // 4) 送出預約
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          service_id: serviceId,
          date,
          time,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "booking failed");
      router.push(`/booking/success?booking_id=${j.booking_id}`);
    } catch (err: any) {
      alert(err.message || "送出失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">預約 {merchantName || ""}</h1>
      <p className="text-gray-600 mt-1">依序選擇服務、日期與時段，再填寫聯絡資料。</p>

      {/* 服務 */}
      <div className="mt-6">
        <label className="block text-sm text-gray-700 mb-1">服務</label>
        <select
          className="w-full rounded-lg border px-3 py-2"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（{s.duration_min ?? 60} 分）
            </option>
          ))}
        </select>
      </div>

      {/* 日期 */}
      <div className="mt-4">
        <label className="block text-sm text-gray-700 mb-1">日期</label>
        <div className="flex flex-wrap gap-2">
          {dates.length === 0 && <span className="text-gray-500 text-sm">無可預約日期</span>}
          {dates.map((d) => (
            <button
              key={d}
              className={`rounded-lg border px-3 py-2 ${
                d === date ? "bg-black text-white" : "hover:bg-gray-50"
              }`}
              onClick={() => setDate(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 時段 */}
      <div className="mt-4">
        <label className="block text-sm text-gray-700 mb-1">時段</label>
        <div className="flex flex-wrap gap-2">
          {times.length === 0 && !!date && (
            <span className="text-gray-500 text-sm">此日期無可預約時段</span>
          )}
          {times.map((t) => (
            <button
              key={t}
              className={`rounded-lg border px-3 py-2 ${
                t === time ? "bg-black text-white" : "hover:bg-gray-50"
              }`}
              onClick={() => setTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 聯絡資料 */}
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">姓名</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="王小明"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
          />
        </div>

        <button
          disabled={!canSubmit || loading}
          className={`w-full rounded-xl px-4 py-2 text-white ${
            canSubmit && !loading ? "bg-black hover:opacity-90" : "bg-gray-400"
          }`}
        >
          {loading ? "送出中…" : "送出預約"}
        </button>
      </form>
    </main>
  );
}
