'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

type Booking = {
  id: string
  customer_name: string | null
  customer_email: string | null
  status: 'pending' | 'confirmed' | 'canceled' | null
  booking_date: string | null
  start_time: string | null
  merchant_id: string | null
}
type Merchant = { id: string; name?: string | null }

export default function BookingList() {
  const [rows, setRows] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [form, setForm] = useState({ merchant_id: '', customer_name: '', customer_email: '', booking_date: '', start_time: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [{ data: bookings, error: e1 }, { data: ms, error: e2 }] = await Promise.all([
      supabase.from('bookings').select('id, customer_name, customer_email, status, booking_date, start_time, merchant_id')
        .order('booking_date', { ascending: true }).order('start_time', { ascending: true }),
      supabase.from('merchants').select('id,name').limit(100),
    ])
    if (e1) toast.error(`讀取失敗：${e1.message}`)
    if (e2) toast.error(`讀取失敗：${e2.message}`)
    setRows(bookings ?? [])
    setMerchants(ms ?? [])
    if (!form.merchant_id && ms && ms.length) setForm(f => ({ ...f, merchant_id: ms[0].id }))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: 'confirmed' | 'canceled') => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) return toast.error(`更新失敗：${error.message}`)
    setRows(rows => rows.map(r => r.id === id ? { ...r, status } : r))
    toast.success(status === 'confirmed' ? '已標記為 Confirmed' : '已標記為 Canceled')
  }

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.merchant_id || !form.customer_name || !form.booking_date || !form.start_time) {
      return toast.warning('商家 / 姓名 / 日期 / 時間 必填')
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
    if (error) return toast.error(`新增失敗：${error.message}`)
    setForm(f => ({ ...f, customer_name: '', customer_email: '', booking_date: '', start_time: '' }))
    toast.success('新增成功')
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('確定刪除？')) return
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) return toast.error(`刪除失敗：${error.message}`)
    setRows(rows => rows.filter(r => r.id !== id))
    toast.success('已刪除')
  }

  const StatusBadge = ({ s }: { s: Booking['status'] }) => {
    if (s === 'confirmed') return <Badge className="bg-green-600 hover:bg-green-600">confirmed</Badge>
    if (s === 'canceled')  return <Badge className="bg-red-600 hover:bg-red-600">canceled</Badge>
    return <Badge className="bg-neutral-600 hover:bg-neutral-600">pending</Badge>
  }

  if (loading) return <div className="p-6">載入中…</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">預約清單</h1>

      {/* 新增表單 */}
      <Card className="p-4">
        <form onSubmit={createBooking} className="grid gap-3 md:grid-cols-5 items-end">
          <div className="space-y-1">
            <Label>商家</Label>
            <Select value={form.merchant_id} onValueChange={(v) => setForm({ ...form, merchant_id: v })}>
              <SelectTrigger><SelectValue placeholder="選擇商家" /></SelectTrigger>
              <SelectContent>
                {merchants.length === 0 && <SelectItem value="" disabled>沒有 merchants</SelectItem>}
                {merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name || m.id.slice(0,8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>顧客姓名</Label><Input value={form.customer_name} onChange={e=>setForm({...form, customer_name:e.target.value})} required /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.customer_email} onChange={e=>setForm({...form, customer_email:e.target.value})} /></div>
          <div className="space-y-1"><Label>日期</Label><Input type="date" value={form.booking_date} onChange={e=>setForm({...form, booking_date:e.target.value})} required /></div>
          <div className="space-y-1"><Label>時間</Label><Input type="time" value={form.start_time} onChange={e=>setForm({...form, start_time:e.target.value})} required /></div>
          <div className="md:col-span-5"><Button disabled={saving} className="w-full md:w-auto">{saving ? '新增中…' : '新增預約'}</Button></div>
        </form>
      </Card>

      {/* 表格 */}
      <Card className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>顧客</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>時間</TableHead>
              <TableHead>動作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.customer_name ?? '—'}</TableCell>
                <TableCell>{b.customer_email ?? '—'}</TableCell>
                <TableCell><StatusBadge s={b.status} /></TableCell>
                <TableCell>{b.booking_date ?? '—'}</TableCell>
                <TableCell>{b.start_time?.slice(0,5) ?? '—'}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-600" onClick={()=>setStatus(b.id,'confirmed')}>Confirm</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-600" onClick={()=>setStatus(b.id,'canceled')}>Cancel</Button>
                  <Button size="sm" variant="secondary" onClick={()=>remove(b.id)}>刪除</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
