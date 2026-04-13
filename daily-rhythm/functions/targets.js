const fs = require('fs');
const path = require('path');

function readCSV(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.trim().split('\n');
    const targets = lines.slice(1).map((line, idx) => {
      const parts = line.split(',');
      return {
        id: idx + 1,
        name: parts[1] || 'TBD',
        business: parts[2] || '',
        signal: parts[3] || '',
        channel: parts[4] || '',
        status: parts[5] ? 'messaged' : 'identified',
        confidence: idx < 2 ? 'HIGH' : 'MEDIUM',
      };
    });
    return targets;
  } catch (e) {
    return [];
  }
}

exports.handler = async (event, context) => {
  try {
    const csvPath = path.resolve(__dirname, '../assets/tracking-template.csv');
    const targets = readCSV(csvPath);

    return {
      statusCode: 200,
      body: JSON.stringify({ targets }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    console.error('Error reading targets:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message, targets: [] }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
