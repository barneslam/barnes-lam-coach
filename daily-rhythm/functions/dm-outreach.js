const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'PATCH only' }) };
  }

  // Extract ID from path: /.netlify/functions/dm-outreach/<id>
  const parts = (event.path || '').split('/');
  const id = parts[parts.length - 1];

  if (!id) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing DM id' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { status } = body;
  const allowed = ['archived', 'disqualified', 'contacted', 'responded', 'qualified', 'booked'];
  if (!status || !allowed.includes(status)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Invalid status. Allowed: ${allowed.join(', ')}` }) };
  }

  const { error } = await supabase
    .from('linkedin_dms')
    .update({ lead_status: status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('dm-outreach update error:', error.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ success: true, id, status })
  };
};
