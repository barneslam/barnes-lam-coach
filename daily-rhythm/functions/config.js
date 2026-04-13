const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const configPath = path.join(__dirname, '../config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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
