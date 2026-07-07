const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

exports.handler = async (event) => {
  const date = event.queryStringParameters?.date;
  if (!date) return { statusCode: 400, body: JSON.stringify({ error: 'Missing date' }) };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?date_key=eq.${date}&order=slot.asc&select=id,date_key,slot,name,phone,service,price,notes`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const bookings = await res.json();
    console.log('Bookings for date:', date, JSON.stringify(bookings));
    return { statusCode: 200, body: JSON.stringify({ bookings }) };
  } catch(err) {
    console.error('Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
