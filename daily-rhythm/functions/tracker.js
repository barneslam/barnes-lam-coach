exports.handler = async (event, context) => {
  try {
    const url = new URL('../tracker.json', `https://${event.headers.host}/`).href;
    const response = await fetch(url);
    const trackerData = await response.json();

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
  } catch (error) {
    console.error('Error reading tracker:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
