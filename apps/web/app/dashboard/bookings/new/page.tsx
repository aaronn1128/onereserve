'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'

type Merchant = { id: string; name?: string | null }
type Service = { id: string; name: string; merchant_id: string }
type Form = {
  merchant_id: string
  service_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_date: string
  start_time: string
  note: string
}

export default function NewBookingPage() {
  const router = useRouter()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Form>({
    merchant_id: '',
    service_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_date: '',
    start_time: '',
    note: '',
  })

  useEffect(() => {
    const load = async () => {
      const [{ data: ms }, { data: ss }] = await Promise.all([
        supabase.from('merchants').select('id,name').limit(200),
        supabase.from('services').select('id,name,merchant_id').limit(500),
      ])
      setMerchants(ms ?? [])
      setServices(ss ?? [])
      if (!form.merchant_id && ms && ms.length) {
        setForm(f => ({ ...f, merchant_id: ms[0].id }))
      }
    }
    load()
  }, [])

  const serviceOptions = useMemo(
    () => services.filter(s => s.merchant_id === form.merchant_id),
    [services, form.merchant_id]
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.merchant_id || !form.customer_name || !form.booking_date || !form.start_time) {
      alert('商家/姓名/日期/時間 為必填'); return
    }
    setSaving(true)
    const { error } = await supabase.from('bookings').insert({
      merchant_id: form.merchant_id,
      service_id: form.service_id || null,
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      booking_date: form.booking_date,
      start_time: form.start_time,
      note: form.note || null,
      status: 'pending',
    })
    setSaving(false)
    if (error) return alert('建立失敗：' + error.message)
    router.replace('/dashboard/bookings')
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>新增預約</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label>商家</label>
          <select
            value={form.merchant_id}
            onChange={(e) => setForm({ ...form, merchant_id: e.target.value, service_id: '' })}
            required
            style={{ width: '100%' }}
          >
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name || m.id.slice(0,8)}</option>)}
          </select>
        </div>
        <div>
          <label>服務</label>
          <select
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">（未選）</option>
            {serviceOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label>顧客姓名</label>
          <input value={form.customer_name} onChange={e=>setForm({...form, customer_name:e.target.value})} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={form.customer_email} onChange={e=>setForm({...form, customer_email:e.target.value})} />
        </div>

        <div>
          <label>電話</label>
          <input value={form.customer_phone} onChange={e=>setForm({...form, customer_phone:e.target.value})} />
        </div>
        <div>
          <label>日期</label>
          <input type="date" value={form.booking_date} onChange={e=>setForm({...form, booking_date:e.target.value})} required />
        </div>

        <div>
          <label>時間</label>
          <input type="time" value={form.start_time} onChange={e=>setForm({...form, start_time:e.target.value})} required />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label>備註</label>
          <textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} rows={3} />
        </div>

        <button type="submit" disabled={saving} style={{ gridColumn: 'span 2', padding:'8px 12px', borderRadius:6 }}>
          {saving ? '建立中…' : '建立預約'}
        </button>
      </form>
    </main>
  )
}
