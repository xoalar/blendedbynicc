const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NICK_EMAIL = process.env.NICK_EMAIL;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }

  const { name, phone, date, slot, dateKey, service, price, notes } = body;
  if (!name || !phone || !date || !slot || !dateKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  // Save booking to Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ date_key: dateKey, slot, name, phone, service, price, notes })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Supabase insert error:', err);
    }
  } catch(err) { console.error('Supabase error:', err); }

  // Send email to Nick
  if (RESEND_API_KEY && NICK_EMAIL) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Blended by Nicc <onboarding@resend.dev>',
          to: [NICK_EMAIL],
          subject: `✂️ New Booking — ${name} | ${slot} on ${date}`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0b10;color:#f0ead8;padding:2rem;border-radius:8px;"><h2 style="color:#d4a843;">✂️ New Booking — Blended by Nicc</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:0.5rem 0;color:#7a7088;">Name</td><td style="font-weight:600;">${name}</td></tr><tr><td style="padding:0.5rem 0;color:#7a7088;">Phone</td><td>${phone}</td></tr><tr><td style="padding:0.5rem 0;color:#7a7088;">Date</td><td>${date}</td></tr><tr><td style="padding:0.5rem 0;color:#7a7088;">Time</td><td style="color:#d4a843;font-weight:600;">${slot}</td></tr><tr><td style="padding:0.5rem 0;color:#7a7088;">Service</td><td>${service || 'Haircut'}</td></tr><tr><td style="padding:0.5rem 0;color:#7a7088;">Price</td><td style="color:#d4a843;">${price || '$35'}</td></tr>${notes ? `<tr><td style="padding:0.5rem 0;color:#7a7088;">Notes</td><td style="font-style:italic;">${notes}</td></tr>` : ''}</table><p style="font-size:0.75rem;color:#7a7088;margin-top:1rem;">Sent from blendedbynicc.com</p></div>`
        })
      });
    } catch(err) { console.error('Email error:', err); }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
