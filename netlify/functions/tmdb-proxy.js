const TMDB_BASE = 'https://api.themoviedb.org/3';

// Allowed TMDB path prefixes to prevent open-proxy abuse
const ALLOWED_PREFIXES = [
  '/movie/', '/tv/', '/search/', '/genre/', '/discover/',
];

exports.handler = async (event) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const params = event.queryStringParameters || {};
  const path = params.path;

  if (!path || typeof path !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing path parameter' }) };
  }

  // Validate that the path is an allowed TMDB endpoint
  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden path' }) };
  }

  // Build query string from remaining params (exclude 'path')
  const forwardParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'path' && value != null) {
      forwardParams.set(key, value);
    }
  }

  const qs = forwardParams.toString();
  const tmdbUrl = `${TMDB_BASE}${path}${qs ? '?' + qs : ''}`;

  try {
    const response = await fetch(tmdbUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
      body,
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch from TMDB' }) };
  }
};
