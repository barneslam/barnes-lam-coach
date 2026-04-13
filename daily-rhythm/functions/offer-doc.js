exports.handler = async (event, context) => {
  try {
    const url = new URL('../assets/offer-doc.md', `https://${event.headers.host}/`).href;
    const response = await fetch(url);
    const content = await response.text();

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
