// Compile daily metrics for summary email
exports.handler = async (event, context) => {
  try {
    // This function reads from tracker and logs to get:
    // 1. Messages sent yesterday
    // 2. New leads discovered yesterday
    // 3. Messages planned for today

    // For now, returns metrics that can be queried
    // In production, this would read from tracker.json and daily logs

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Placeholder metrics - in production these come from tracker.json and logs
    const metrics = {
      date: today,
      yesterday_summary: {
        date: yesterday,
        messages_sent: 0,
        new_leads: 0
      },
      today_plan: {
        messages_planned: 0
      },
      tracker_url: `/api/tracker`,
      logs_url: `/logs/${yesterday}.md`
    };

    return {
      statusCode: 200,
      body: JSON.stringify(metrics),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error compiling metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
