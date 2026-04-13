const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Extract date from path parameter
    const date = event.path.split('/').pop();

    if (!date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Date parameter required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const logPath = path.join(__dirname, '../logs', `${date}.md`);

    if (!fs.existsSync(logPath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ date, content: `No log found for ${date}` }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const content = fs.readFileSync(logPath, 'utf8');

    return {
      statusCode: 200,
      body: JSON.stringify({ date, content }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading log:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
