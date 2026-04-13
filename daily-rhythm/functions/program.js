const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const programPath = path.join(__dirname, '../program-8week.json');
    const programData = JSON.parse(fs.readFileSync(programPath, 'utf8'));

    return {
      statusCode: 200,
      body: JSON.stringify(programData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading program:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
