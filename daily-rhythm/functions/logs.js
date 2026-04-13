const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    let logFiles = [];

    if (fs.existsSync(logsDir)) {
      logFiles = fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''))
        .reverse();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(logFiles),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading logs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
