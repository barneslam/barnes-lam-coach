const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const drafts = [];
    const assetsDir = path.join(__dirname, '../assets');

    if (fs.existsSync(assetsDir)) {
      fs.readdirSync(assetsDir).forEach(file => {
        if (file.endsWith('.md')) {
          const filepath = path.join(assetsDir, file);
          const content = fs.readFileSync(filepath, 'utf8');
          const status = file.includes('outreach') ? 'pending' : 'approved';
          drafts.push({
            filename: file,
            status: status,
            content: content.substring(0, 500),
          });
        }
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(drafts),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading drafts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
