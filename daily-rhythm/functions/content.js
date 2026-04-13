const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const contentDir = path.join(__dirname, '../content');
    let contentFiles = [];

    if (fs.existsSync(contentDir)) {
      contentFiles = fs.readdirSync(contentDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({
          filename: f,
          content: fs.readFileSync(path.join(contentDir, f), 'utf8'),
        }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify(contentFiles),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading content:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
