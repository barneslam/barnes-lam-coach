const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { week, approved_by, checklist_items, message_count, notes } = body;

    const approvalData = {
      week: week || 1,
      approval_date: new Date().toISOString().split('T')[0],
      approved_at: new Date().toISOString(),
      status: 'approved',
      approved_by: approved_by || 'user',
      checklist_completed: checklist_items || 7,
      checklist_items: 7,
      message_count: message_count || 7,
      approval_notes: notes || '',
      batch_id: `week-${week}-${Date.now()}`,
    };

    const { data, error } = await supabase
      .from('outreach_approval')
      .insert([approvalData])
      .select();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    console.error('Approval logging error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
