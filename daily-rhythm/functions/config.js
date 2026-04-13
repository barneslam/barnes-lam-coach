const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Try multiple possible paths in Netlify Function environment
    const possiblePaths = [
      path.join(__dirname, '../config.json'),
      path.join(process.env.LAMBDA_TASK_ROOT || '', 'config.json'),
      '/var/task/config.json'
    ];

    let configData = null;
    for (const filepath of possiblePaths) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        configData = JSON.parse(content);
        break;
      } catch (e) {
        // Try next path
      }
    }

    if (!configData) {
      throw new Error('Config file not found in any expected location');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(configData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading config:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
