const fs = require('fs');
const path = require('path');

// Load .env file into process.env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        process.env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
      }
    }
  }
}

module.exports = {
  '/api/tmdb': {
    target: 'https://api.themoviedb.org',
    changeOrigin: true,
    secure: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const url = new URL(req.url, 'http://localhost');
        const tmdbPath = url.searchParams.get('path');
        url.searchParams.delete('path');
        const qs = url.searchParams.toString();
        proxyReq.path = `/3${tmdbPath}${qs ? '?' + qs : ''}`;
        proxyReq.setHeader('Authorization', `Bearer ${process.env.TMDB_API_KEY}`);
        proxyReq.setHeader('accept', 'application/json');
      });
    },
  },
};
