const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const { data: leads, error } = await supabase
      .from('discovered_leads')
      .select('*')
      .order('discovered_at', { ascending: false });

    if (error) {
      throw error;
    }

    const lastDiscoveryDate = leads && leads.length > 0
      ? leads[0].discovered_date
      : null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        leads: leads || [],
        count: leads?.length || 0,
        lastDiscoveryDate
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error fetching discovered leads:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, leads: [], count: 0 }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
