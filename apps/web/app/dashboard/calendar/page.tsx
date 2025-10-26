'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 日曆在地化
const locales = {}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

type Row = {
  id: string
  customer_name: string | null
  booking_date: string | null // 'YYYY-MM-DD'
  start_time: string | null   // 'HH:mm:ss' or 'HH:mm'
  status: string | null
}

export default function CalendarPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState<Date>(new Date())

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer_name, booking_date, start_time, status')
        .order('booking_date')
      if (error) console.error(error)
      setRows(data ?? [])
    }
    load()
  }, [])

  const events = useMemo(() => {
    return rows.flatMap((r) => {
      if (!r.booking_date || !r.start_time) return []
      const hhmm = r.start_time.slice(0, 5) // 'HH:mm'
      const start = new Date(`${r.booking_date}T${hhmm}:00`)
      const end = addMinutes(start, 60) // 先視為 1hr
      return [{
        id: r.id,
        title: `${r.customer_name || '預約'} (${r.status || 'pending'})`,
        start,
        end,
        status: r.status,
      }]
    })
  }, [rows])

  const eventStyleGetter = (event: any) => {
    let bg = '#6b7280' // pending
    if (event.status === 'confirmed') bg = '#16a34a'
    if (event.status === 'canceled') bg = '#dc2626'
    return { style: { backgroundColor: bg, color: 'white', borderRadius: 6, border: 'none' } }
  }

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>📅 預約日曆</h1>
      <div style={{ height: 720 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          // 受控：工具列/切換都會生效
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={['month', 'week', 'day', 'agenda']}
          style={{ height: '100%' }}
        />
      </div>
    </main>
  )
}
