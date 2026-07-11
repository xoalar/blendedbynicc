const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'blendedbynicc2025';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }

  const { password, key, value } = body;
  if (password !== ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const allowed = ['shopHours', 'perDaySlots', 'perDateSlots', 'blockedDates'];
  if (!allowed.includes(key)) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid key' }) };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
    });

    if (res.ok) return { statusCode: 200, body: JSON.stringify({ success: true }) };
    const err = await res.text();
    console.error('Supabase save error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save' }) };
  } catch(err) {
    console.error('save-settings error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
