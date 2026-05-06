const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };

  const path = event.path || event.rawPath || '';

  // Handle POST /api/drafts/{id}/delete
  if (event.httpMethod === 'POST' && path.includes('/delete')) {
    try {
      const match = path.match(/\/drafts\/([^/]+)\/delete/) || event.rawUrl?.match(/\/drafts\/([^/]+)\/delete/);
      if (!match) {
        // Try to extract from the splat parameter if it exists
        const splat = event.requestContext?.http?.rawPath || '';
        const splatMatch = splat.match(/\/drafts\/([^/]+)\/delete/);
        if (!splatMatch) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid draft ID in path' }) };
        const draftId = splatMatch[1];
        const { error } = await supabase.from('gtm_drafts').delete().eq('id', draftId);
        if (error) throw error;
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Draft deleted' }) };
      }

      const draftId = match[1];
      const { error } = await supabase
        .from('gtm_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, message: 'Draft deleted' })
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Handle POST /api/drafts/{id}/reject
  if (event.httpMethod === 'POST' && path.includes('/reject')) {
    try {
      const match = path.match(/\/drafts\/([^/]+)\/reject/) || event.rawUrl?.match(/\/drafts\/([^/]+)\/reject/);
      if (!match) {
        const splat = event.requestContext?.http?.rawPath || '';
        const splatMatch = splat.match(/\/drafts\/([^/]+)\/reject/);
        if (!splatMatch) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid draft ID in path' }) };
        const draftId = splatMatch[1];
        const { error } = await supabase.from('gtm_drafts').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', draftId);
        if (error) throw error;
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Draft rejected' }) };
      }

      const draftId = match[1];
      const { error } = await supabase
        .from('gtm_drafts')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', draftId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, message: 'Draft rejected' })
      };
    } catch (err) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Handle GET - return all drafts grouped by status
  try {
    const { data, error } = await supabase
      .from('gtm_drafts')
      .select('*')
      .order('draft_date', { ascending: true });

    if (error) throw error;

    const pending = data.filter(d => d.status === 'pending' || d.status === 'pending_approval');
    const approved = data.filter(d => d.status === 'approved');
    const published = data.filter(d => d.status === 'published');

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ pending, approved, published })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
