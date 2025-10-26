import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    // 🔍 Debug: 檢查環境變數是否讀到
    const key = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    console.log('🧩 RESEND_API_KEY loaded:', key ? key.slice(0, 10) + '...' : '❌ not found');
    console.log('🧩 FROM_EMAIL loaded:', from);

    if (!key) {
      return NextResponse.json({ error: 'Resend API key not loaded' }, { status: 500 });
    }

    const resend = new Resend(key);

    const body = await req.json();
    console.log('📨 /api/notify triggered with:', body);

    const testEmail = 'aaronn1128@gmail.com'; // 👈 改成你自己的 Gmail
    const subject = `OneReserve 測試通知`;
    const html = `
      <div style="font-family:ui-sans-serif,system-ui">
        <h2>✅ 測試寄信成功</h2>
        <p>這是從 <b>/api/notify</b> 寄出的測試信。</p>
        <p>時間：${new Date().toLocaleString('zh-TW')}</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: from || 'OneReserve <onboarding@resend.dev>',
      to: testEmail,
      subject,
      html
    });

    console.log('✅ Resend response:', result);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('❌ Error sending email:', e);
    return NextResponse.json({ error: e.message || 'send failed' }, { status: 500 });
  }
}
