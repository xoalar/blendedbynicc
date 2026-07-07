const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'blendedbynicc2025';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }

  const { id, password } = body;
  if (password !== ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    const text = await res.text();
    console.log('Delete status:', res.status, 'Body:', text);

    if (res.ok) return { statusCode: 200, body: JSON.stringify({ success: true }) };
    return { statusCode: 500, body: JSON.stringify({ error: 'Delete failed', status: res.status, details: text }) };
  } catch(err) {
    console.error('Cancel error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
