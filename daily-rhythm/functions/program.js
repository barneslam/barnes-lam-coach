// Load program at module level
let programData;
try {
  programData = require('../program-8week.json');
} catch (e) {
  programData = { error: 'Program file not found' };
}

exports.handler = async (event, context) => {
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
};
