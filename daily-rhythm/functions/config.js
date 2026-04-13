exports.handler = async (event, context) => {
  try {
    // Fetch config.json from published static files
    const url = new URL('../config.json', `https://${event.headers.host}/`).href;
    const response = await fetch(url);
    const configData = await response.json();

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
