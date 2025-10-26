export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">OneReserve Demo</h1>
      <p className="text-gray-600 mb-6">請選擇要前往的頁面：</p>

      <div className="space-y-3">
        <a
          href="/m/demo-stylist/book"
          className="inline-block rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
        >
          前往預約頁（demo-stylist）
        </a>

        <div className="text-sm text-gray-500">
          若你有自己的商家 slug，將網址改成 <code>/m/你的 slug/book</code> 即可。
        </div>
      </div>
    </main>
  );
}
