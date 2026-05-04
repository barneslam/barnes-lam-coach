const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { id, content, title, status } = JSON.parse(event.body || '{}');

    if (!id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id is required' }) };
    }

    const updates = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('gtm_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, draft: data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
