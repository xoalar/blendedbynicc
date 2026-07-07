const { getStore } = require('@netlify/blobs');

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'blendedbynicc2025';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid body' }) }; }

  const { password, key, value } = body;

  if (password !== ADMIN_PASS) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const allowed = ['shopHours', 'perDaySlots', 'bookedSlots', 'blockedDates'];
  if (!allowed.includes(key)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid key' }) };
  }

  try {
    const store = getStore('blendedbynicc');
    await store.set(key, JSON.stringify(value));
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch(err) {
    console.error('save-settings error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save' }) };
  }
};
