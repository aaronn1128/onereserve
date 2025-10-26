'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

type Booking = {
  id: string
  customer_name: string | null
  customer_email: string | null
  status: string | null
  booking_date: string | null
  start_time: string | null
  merchant_id: string | null
}

type Merchant = { id: string; name?: string | null }

export default function BookingList() {
  const [rows, setRows] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [form, setForm] = useState({
    merchant_id: '',
    customer_name: '',
    customer_email: '',
    booking_date: '',
    start_time: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [{ data: bookings }, { data: ms }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, customer_name, customer_email, status, booking_date, start_time, merchant_id')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase.from('merchants').select('id,name').limit(100),
    ])
    setRows(bookings ?? [])
    setMerchants(ms ?? [])
    if (!form.merchant_id && ms && ms.length) {
      setForm((f) => ({ ...f, merchant_id: ms[0].id }))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.merchant_id || !form.customer_name || !form.booking_date || !form.start_time) {
      alert('商家/姓名/日期/時間 必填'); return
    }
    setSaving(true)
    const { error } = await supabase.from('bookings').insert({
      merchant_id: form.merchant_id,
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      booking_date: form.booking_date,
      start_time: form.start_time,
      status: 'pending',
    })
    setSaving(false)
    if (error) return alert('新增失敗：' + error.message)
    setForm((f) => ({ ...f, customer_name: '', customer_email: '', booking_date: '', start_time: '' }))
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('確定刪除？')) return
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) return alert('刪除失敗：' + error.message)
    load()
  }

  if (loading) return <div style={{ padding: 24 }}>載入中…</div>

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>預約清單（Supabase）</h1>

      {/* 新增表單 */}
      <form onSubmit={createBooking} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', alignItems: 'end', marginBottom: 16 }}>
        <div>
          <label>商家</label>
          <select
            value={form.merchant_id}
            onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
            style={{ width: '100%' }}
            required
          >
            {merchants.length === 0 && <option value="">（沒有 merchants）</option>}
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name || m.id.slice(0,8)}</option>)}
          </select>
        </div>
        <div>
          <label>顧客姓名</label>
          <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
        </div>
        <div>
          <label>日期</label>
          <input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} required />
        </div>
        <div>
          <label>時間</label>
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
        </div>
        <button type="submit" disabled={saving} style={{ gridColumn: '1 / -1', padding: '8px 12px', borderRadius: 6 }}>
          {saving ? '新增中…' : '新增預約'}
        </button>
      </form>

      {/* 列表 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">顧客</th>
            <th align="left">Email</th>
            <th align="left">狀態</th>
            <th align="left">日期</th>
            <th align="left">時間</th>
            <th align="left">動作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(b => (
            <tr key={b.id}>
              <td>{b.customer_name ?? '—'}</td>
              <td>{b.customer_email ?? '—'}</td>
              <td>{b.status ?? '—'}</td>
              <td>{b.booking_date ?? '—'}</td>
              <td>{b.start_time?.slice(0,5) ?? '—'}</td>
              <td><button onClick={() => remove(b.id)}>刪除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
