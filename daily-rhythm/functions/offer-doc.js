const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const filepath = path.join(__dirname, '../assets/offer-doc.md');
    const content = fs.readFileSync(filepath, 'utf8');

    return {
      statusCode: 200,
      body: JSON.stringify({ content }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading offer doc:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, content: '' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
