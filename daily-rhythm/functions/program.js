const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Try multiple possible paths in Netlify Function environment
    const possiblePaths = [
      path.join(__dirname, '../program-8week.json'),
      path.join(process.env.LAMBDA_TASK_ROOT || '', 'program-8week.json'),
      '/var/task/program-8week.json'
    ];

    let programData = null;
    for (const filepath of possiblePaths) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        programData = JSON.parse(content);
        break;
      } catch (e) {
        // Try next path
      }
    }

    if (!programData) {
      throw new Error('Program file not found in any expected location');
    }

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
