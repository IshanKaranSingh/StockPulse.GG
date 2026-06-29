// netlify/functions/quote.js
// Proxies requests to Finnhub so your API key stays hidden server-side.
// Users call /.netlify/functions/quote?symbol=AAPL
// This function calls Finnhub with your secret key and returns the data.

exports.handler = async (event) => {
  const FINNHUB_KEY = process.env.FINNHUB_KEY;

  if (!FINNHUB_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'FINNHUB_KEY environment variable not set' }),
    };
  }

  const symbol = event.queryStringParameters?.symbol;
  if (!symbol) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing symbol parameter' }),
    };
  }

  // Sanitize — only allow uppercase letters, 1–5 chars (valid ticker format)
  const clean = symbol.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${clean}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 60s so rapid page loads don't spam Finnhub
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Finnhub fetch failed', detail: err.message }),
    };
  }
};
