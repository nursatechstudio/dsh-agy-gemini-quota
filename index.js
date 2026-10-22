const { getValidAuth, extractAntigravityToken, saveStoredAuth, clearStoredAuth, startOAuthLogin } = require('./src/auth');
const { fetchUserQuotaSummary, fetchUserProfile } = require('./src/quota');

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// In-memory cache for quota to avoid spamming Google Cloud Code
let cachedQuota = null;
let lastQuotaFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

async function getQuotaWithCache(auth, force = false) {
  const now = Date.now();
  if (!force && cachedQuota && (now - lastQuotaFetchTime < CACHE_TTL_MS)) {
    return cachedQuota;
  }

  const [quota, user] = await Promise.all([
    fetchUserQuotaSummary(auth.accessToken),
    fetchUserProfile(auth.accessToken),
  ]);

  cachedQuota = { quota, user, authSource: auth.source };
  lastQuotaFetchTime = now;
  return cachedQuota;
}

const plugin = {
  name: 'dsh-plugin-agy-quota',
  inject: ['webServer'],
  apply(ctx) {
    ctx.inject(['webServer'], (webCtx) => {
      webCtx.effect(() => webCtx.webServer.register({
        kind: 'prefix',
        path: '/api/agy-quota',
        handler: async (req, res) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end();
            return;
          }

          const pathname = new URL(String(req.url), 'http://localhost').pathname;

          try {
            // GET /api/agy-quota/status
            if (pathname === '/api/agy-quota/status' && req.method === 'GET') {
              const url = new URL(String(req.url), 'http://localhost');
              const force = url.searchParams.get('force') === 'true';

              const auth = await getValidAuth();
              if (!auth || !auth.accessToken) {
                sendJson(res, 200, {
                  ok: false,
                  authenticated: false,
                  message: 'No Antigravity credentials found. Please log in or auto-detect.',
                });
                return;
              }

              const data = await getQuotaWithCache(auth, force);
              sendJson(res, 200, {
                ok: true,
                authenticated: true,
                authSource: data.authSource,
                user: data.user,
                quota: data.quota,
              });
              return;
            }

            // POST /api/agy-quota/detect
            if (pathname === '/api/agy-quota/detect' && req.method === 'POST') {
              const localAuth = await getValidAuth(true); // force re-scan
              if (!localAuth || !localAuth.accessToken) {
                sendJson(res, 404, {
                  ok: false,
                  message: 'Antigravity IDE local credentials not found.',
                });
                return;
              }

              cachedQuota = null; // bust cache
              const data = await getQuotaWithCache(localAuth, true);
              sendJson(res, 200, {
                ok: true,
                authenticated: true,
                authSource: localAuth.source,
                user: data.user,
                quota: data.quota,
              });
              return;
            }

            // POST /api/agy-quota/oauth/start
            if (pathname === '/api/agy-quota/oauth/start' && req.method === 'POST') {
              const oauthInfo = await startOAuthLogin();
              sendJson(res, 200, {
                ok: true,
                authUrl: oauthInfo.authUrl,
                port: oauthInfo.port,
              });
              return;
            }

            // POST /api/agy-quota/manual
            if (pathname === '/api/agy-quota/manual' && req.method === 'POST') {
              const body = await parseJsonBody(req);
              if (!body.refreshToken && !body.accessToken) {
                sendJson(res, 400, { ok: false, message: 'Missing refreshToken or accessToken' });
                return;
              }

              saveStoredAuth({
                accessToken: body.accessToken || null,
                refreshToken: body.refreshToken || null,
                source: 'manual',
                expiresAt: body.accessToken ? Date.now() + 3600 * 1000 : null,
              });

              cachedQuota = null;
              const auth = await getValidAuth();
              if (!auth) {
                sendJson(res, 400, { ok: false, message: 'Invalid token provided.' });
                return;
              }

              const data = await getQuotaWithCache(auth, true);
              sendJson(res, 200, {
                ok: true,
                authenticated: true,
                authSource: 'manual',
                user: data.user,
                quota: data.quota,
              });
              return;
            }

            // POST /api/agy-quota/logout
            if (pathname === '/api/agy-quota/logout' && req.method === 'POST') {
              clearStoredAuth();
              cachedQuota = null;
              sendJson(res, 200, { ok: true, authenticated: false });
              return;
            }

            sendJson(res, 404, { ok: false, message: `Route not found: ${pathname}` });
          } catch (err) {
            console.error('[agy-quota] API error:', err);
            sendJson(res, 500, {
              ok: false,
              message: err.message || 'Internal server error',
            });
          }
        },
      }), 'agy-quota: /api/agy-quota route');
    });
  },
};

module.exports = plugin;
module.exports.default = plugin;
