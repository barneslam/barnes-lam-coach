// Load config at module level
let configData;
try {
  configData = require('../config.json');
} catch (e) {
  configData = { error: 'Config file not found' };
}

exports.handler = async (event, context) => {
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
};
