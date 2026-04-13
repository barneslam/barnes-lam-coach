const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const trackerPath = path.join(__dirname, '../tracker.json');
    const trackerData = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

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
