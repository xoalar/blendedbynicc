const { getStore } = require('@netlify/blobs');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NICK_EMAIL     = process.env.NICK_EMAIL;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }

  const { name, phone, date, slot, dateKey, service, price, notes } = body;
  if (!name || !phone || !date || !slot || !dateKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  try {
    const store = getStore('blendedbynicc');
    const raw = await Promise.race([
      store.get('bookedSlots'),
      new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 4000))
    ]).catch(() => null);

    const bookedSlots = raw ? JSON.parse(raw) : {};
    if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
    if (!bookedSlots[dateKey].includes(slot)) bookedSlots[dateKey].push(slot);

    await Promise.race([
      store.set('bookedSlots', JSON.stringify(bookedSlots)),
      new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 4000))
    ]).catch(() => null);
  } catch(err) { console.error('Blob error:', err); }

  if (RESEND_API_KEY && NICK_EMAIL) {
    sendEmail({ name, phone, date, slot, service, price, notes }).catch(e => console.error('Email error:', e));
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};

async function sendEmail({ name, phone, date, slot, service, price, notes }) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Blended by Nicc <onboarding@resend.dev>',
      to: [NICK_EMAIL],
      subject: `✂️ New Booking — ${name} | ${slot} on ${date}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0b10;color:#f0ead8;padding:2rem;border-radius:8px;">
          <h2 style="color:#d4a843;margin-bottom:0.25rem;">✂️ New Booking</h2>
          <p style="color:#9b7ec8;margin-top:0;font-size:0.85rem;">Blended by Nicc</p>
          <hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Name</td><td style="padding:0.5rem 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Phone</td><td style="padding:0.5rem 0;">${phone}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Date</td><td style="padding:0.5rem 0;">${date}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Time</td><td style="padding:0.5rem 0;color:#d4a843;font-weight:600;">${slot}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Service</td><td style="padding:0.5rem 0;">${service || 'Haircut'}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#7a7088;">Price</td><td style="padding:0.5rem 0;color:#d4a843;">${price || '$35'}</td></tr>
            ${notes ? `<tr><td style="padding:0.5rem 0;color:#7a7088;">Notes</td><td style="padding:0.5rem 0;font-style:italic;">${notes}</td></tr>` : ''}
          </table>
          <hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0;">
          <p style="font-size:0.75rem;color:#7a7088;margin:0;">Sent from blendedbynicc.com</p>
        </div>
      `
    })
  });
}
