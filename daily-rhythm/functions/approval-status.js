const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const week = event.queryStringParameters?.week || 1;
    const { data, error } = await supabase
      .from('outreach_approval')
      .select('*')
      .eq('week', week)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const approvalData = data && data.length > 0 ? data[0] : null;

    return {
      statusCode: 200,
      body: JSON.stringify({ status: approvalData?.status || 'pending', data: approvalData }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error fetching approval status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, status: 'pending' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
