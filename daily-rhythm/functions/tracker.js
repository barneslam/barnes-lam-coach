const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Try multiple possible paths in Netlify Function environment
    const possiblePaths = [
      path.join(__dirname, '../tracker.json'),
      path.join(process.env.LAMBDA_TASK_ROOT || '', 'tracker.json'),
      '/var/task/tracker.json'
    ];

    let trackerData = null;
    for (const filepath of possiblePaths) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        trackerData = JSON.parse(content);
        break;
      } catch (e) {
        // Try next path
      }
    }

    if (!trackerData) {
      throw new Error('Tracker file not found in any expected location');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(trackerData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading tracker:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
