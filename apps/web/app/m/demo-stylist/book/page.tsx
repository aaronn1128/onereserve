"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// DEMO：綁定 demo-stylist 的 service_id（你之前用來下單成功的那個）
const DEMO_SERVICE_ID = "2a63bc77-1cea-4540-a3c7-95d7630d4b3b";

type IsoDate = string; // 'YYYY-MM-DD'
type Hm = string;      // 'HH:MM'

export default function DemoBookPage() {
  const router = useRouter();

  // 資料狀態
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<IsoDate[]>([]);
  const [times, setTimes] = useState<Hm[]>([]);

  // 選擇狀態
  const [selectedDate, setSelectedDate] = useState<IsoDate>("");
  const [selectedTime, setSelectedTime] = useState<Hm>("");

  // 表單
  const [name, setName] = useState("王小明");
  const [email, setEmail] = useState("you@example.com");

  const canSubmit = useMemo(
    () => !!(name && email && selectedDate && selectedTime),
    [name, email, selectedDate, selectedTime]
  );

  // 載入可預約「日期」
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/slots/dates?service_id=${DEMO_SERVICE_ID}`
        );
        const json = await res.json();
        if (!abort) {
          if (res.ok) {
            setDates(json.dates ?? []);
            // 預設選今天或第一個
            if ((json.dates ?? []).length > 0) {
              setSelectedDate(json.dates[0]);
            }
          } else {
            alert(json?.error ?? "無法取得可預約日期");
          }
        }
      } catch (e: any) {
        if (!abort) alert(e?.message ?? "發生錯誤");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  // 選到日期後，載入「該日可預約時間」
  useEffect(() => {
    if (!selectedDate) return;
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/slots/times?service_id=${DEMO_SERVICE_ID}&date=${selectedDate}`
        );
        const json = await res.json();
        if (!abort) {
          if (res.ok) {
            setTimes(json.times ?? []);
            setSelectedTime(""); // 重新選
          } else {
            alert(json?.error ?? "無法取得可預約時段");
          }
        }
      } catch (e: any) {
        if (!abort) alert(e?.message ?? "發生錯誤");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [selectedDate]);

  async function submitBooking() {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_email: email,
          service_id: DEMO_SERVICE_ID,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? "預約失敗");
        return;
      }
      const bookingId = json.booking_id as string;
      router.push(`/booking/success?booking_id=${bookingId}`);
    } catch (e: any) {
      alert(e?.message ?? "預約失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Demo Stylist 預約頁</h1>
      <p className="mt-2 text-gray-600">
        依序選擇「日期」→「時段」，再填寫聯絡資料送出預約。
      </p>

      <section className="mt-6 space-y-6">
        {/* 日期 */}
        <div>
          <div className="mb-2 font-medium">日期</div>
          {dates.length === 0 ? (
            <div className="text-gray-500">目前沒有可預約日期</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => {
                const active = d === selectedDate;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={
                      "rounded-xl border px-3 py-2 " +
                      (active ? "bg-black text-white" : "hover:bg-gray-50")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 時段 */}
        <div>
          <div className="mb-2 font-medium">時段</div>
          {!selectedDate ? (
            <div className="text-gray-500">請先選擇日期</div>
          ) : times.length === 0 ? (
            <div className="text-gray-500">該日期目前沒有可預約時段</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {times.map((t) => {
                const active = t === selectedTime;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={
                      "rounded-xl border px-3 py-2 " +
                      (active ? "bg-black text-white" : "hover:bg-gray-50")
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 聯絡資料 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600">姓名</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="王小明"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Email</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* 送出 */}
        <div>
          <button
            disabled={!canSubmit || loading}
            onClick={submitBooking}
            className={
              "rounded-xl px-4 py-2 text-white " +
              (canSubmit && !loading
                ? "bg-black hover:opacity-90"
                : "bg-gray-400 cursor-not-allowed")
            }
          >
            {loading ? "送出中…" : "送出預約"}
          </button>
        </div>
      </section>
    </main>
  );
}
