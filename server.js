const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 3000;
const fallbackImageFor = (name) => `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase())}/300/300`;

function loadEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !match[1].startsWith('#') && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

loadEnv();
const cachePath = path.join(root, 'data', 'product-images.json');
function readCache() { try { return JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch { return {}; } }
function writeCache(cache) { fs.mkdirSync(path.dirname(cachePath), { recursive: true }); fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2)); }

async function findImage(productName) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return fallbackImageFor(productName);
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', productName);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'squarish');
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } });
  if (!response.ok) throw new Error(`Unsplash returned ${response.status}`);
  const result = await response.json();
  return result.results?.[0]?.urls?.small || fallbackImageFor(productName);
}

function send(res, status, body, type = 'application/json') { res.writeHead(status, { 'Content-Type': type }); res.end(body); }
function serveFile(res, urlPath) {
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
  const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };
  send(res, 200, fs.readFileSync(filePath), types[path.extname(filePath)] || 'application/octet-stream');
}

http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && requestUrl.pathname === '/api/product-images') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const products = JSON.parse(body).products;
        if (!Array.isArray(products) || products.length > 10) return send(res, 400, JSON.stringify({ error: 'Provide up to 10 products.' }));
        const cache = readCache();
        const hasUnsplashKey = Boolean(process.env.UNSPLASH_ACCESS_KEY);
        const images = {};
        for (const product of products) {
          const cacheKey = String(product.id);
          if (hasUnsplashKey && !cache[cacheKey]) {
            try { cache[cacheKey] = await findImage(product.name); }
            catch { /* A product-specific fallback is returned below. */ }
          }
          images[cacheKey] = cache[cacheKey] || fallbackImageFor(product.name);
        }
        writeCache(cache);
        send(res, 200, JSON.stringify({ images, usingFallback: !hasUnsplashKey }));
      } catch { send(res, 400, JSON.stringify({ error: 'Invalid request.' })); }
    });
    return;
  }
  serveFile(res, requestUrl.pathname);
}).listen(port, () => console.log(`ShopSwift running at http://localhost:${port}`));
