// Load tracker at module level
let trackerData;
try {
  trackerData = require('../tracker.json');
} catch (e) {
  trackerData = { error: 'Tracker file not found' };
}

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(trackerData),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };
};
