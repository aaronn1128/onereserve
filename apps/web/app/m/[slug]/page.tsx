'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/../lib/supabase';

type Merchant = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  contact_email: string | null;
};

type Service = {
  id: string;
  name: string;
  duration_min: number | null;
  price: number | null;
};

export default function MerchantPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: m, error: me } = await supabase
        .from('merchants')
        .select('id, slug, name, description, contact_email')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (me || !m) {
        setLoading(false);
        return;
      }
      setMerchant(m);

      const { data: sv } = await supabase
        .from('services')
        .select('id, name, duration_min, price')
        .eq('merchant_id', m.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      setServices(sv || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <div style={{padding:16}}>Loading…</div>;
  if (!merchant) return <div style={{padding:16}}>Merchant not found.</div>;

  return (
    <div style={{maxWidth:720, margin:'24px auto', padding:'0 16px'}}>
      <h1 style={{margin:'8px 0'}}>{merchant.name}</h1>
      {merchant.description && <p style={{opacity:.8}}>{merchant.description}</p>}

      <h2 style={{margin:'24px 0 8px'}}>可預約服務</h2>
      {services.length === 0 && <div>尚無服務。</div>}
      <ul style={{listStyle:'none', padding:0, margin:0}}>
        {services.map(s => (
          <li key={s.id} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:12, margin:'8px 0'}}>
            <div style={{fontWeight:600}}>{s.name}</div>
            <div style={{fontSize:14, opacity:.8}}>
              {s.duration_min ? `${s.duration_min} 分鐘` : '時長未設定'} · {s.price != null ? `NT$ ${s.price}` : '未定價'}
            </div>
            <button
              style={{marginTop:8, padding:'8px 12px', border:'1px solid #000', borderRadius:6, background:'#000', color:'#fff'}}
              onClick={() => router.push(`/m/${merchant.slug}/book?service=${s.id}`)}
            >
              預約此服務
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
