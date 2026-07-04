const { getStore } = require('@netlify/blobs');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE       = process.env.TWILIO_PHONE;
const NICK_PHONE         = process.env.NICK_PHONE;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }
  const { name, phone, date, slot, dateKey, service, price, notes } = body;
  if (!name || !phone || !date || !slot) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };

  // Save booking to Blobs
  try {
    const store = getStore('blendedbynicc');
    const raw = await store.get('bookedSlots').catch(() => null);
    const bookedSlots = raw ? JSON.parse(raw) : {};
    if (!bookedSlots[dateKey]) bookedSlots[dateKey] = [];
    if (!bookedSlots[dateKey].includes(slot)) bookedSlots[dateKey].push(slot);
    await store.set('bookedSlots', JSON.stringify(bookedSlots));
  } catch(err) { console.error('Blob save error:', err); }

  // SMS
  const confirmationMsg = `✂️ Booking Confirmed — Blended by Nicc\n\nHey ${name}! You're all set.\n\n📅 ${date}\n🕐 ${slot}\n💈 ${service||'Haircut'} — ${price||'$35'}\n${notes?'📝 Notes: '+notes+'\n':''}\nNeed to cancel? DM @blendedbynicc on Instagram at least 2 hours before to avoid the $5 no-show fee.\n\nReply STOP to opt out.`;
  const nickAlertMsg = `📲 New Booking — Blended by Nicc\n\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${slot}\nService: ${service||'Haircut'} — ${price||'$35'}\n${notes?'Notes: '+notes:''}`;

  try {
    await sendSMS(phone, confirmationMsg);
    if (NICK_PHONE) await sendSMS(NICK_PHONE, nickAlertMsg);
  } catch(err) { console.error('SMS error:', err); }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};

async function sendSMS(to, body) {
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams();
  params.append('To', to); params.append('From', TWILIO_PHONE); params.append('Body', body);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
  return res.json();
}
