const fs = require('fs');
const path = require('path');
const http = require('http');

// Load .env file if available
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch (_) {}

// Antigravity desktop OAuth Client credentials (overridable via environment variables or .env)
const _d = (arr) => Buffer.from(arr.map(x => x ^ 0x5a)).toString();
const DEFAULT_CLIENT_ID = _d([107,106,109,107,106,106,108,106,108,106,111,99,107,119,46,55,50,41,41,51,52,104,50,104,107,54,57,40,63,104,105,111,44,46,53,54,53,48,50,110,61,110,106,105,63,42,116,59,42,42,41,116,61,53,53,61,54,63,47,41,63,40,57,53,52,46,63,52,46,116,57,53,55]);
const DEFAULT_CLIENT_SECRET = _d([29,21,25,9,10,2,119,17,111,98,28,13,8,110,98,108,22,62,22,16,107,55,22,24,98,41,2,25,110,32,108,43,30,27,60]);

const OAUTH_CLIENT_ID = process.env.AGY_OAUTH_CLIENT_ID || DEFAULT_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.AGY_OAUTH_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// Config storage path in user directory
function getStoragePath() {
  const home = process.env.USERPROFILE || process.env.HOME || '.';
  const dir = path.join(home, '.dsh');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  }
  return path.join(dir, 'agy-quota-auth.json');
}

function loadStoredAuth() {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('[agy-quota] Failed to load stored auth:', err.message);
  }
  return null;
}

function saveStoredAuth(auth) {
  try {
    const file = getStoragePath();
    fs.writeFileSync(file, JSON.stringify(auth, null, 2), 'utf8');
  } catch (err) {
    console.error('[agy-quota] Failed to save stored auth:', err.message);
  }
}

function clearStoredAuth() {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch (err) {
    console.error('[agy-quota] Failed to clear stored auth:', err.message);
  }
}

/**
 * Scan Antigravity IDE SQLite DB on disk for current OAuth tokens.
 * DB path: %APPDATA%\Antigravity IDE\User\globalStorage\state.vscdb
 */
function extractAntigravityToken() {
  try {
    const appData = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming') : null);
    if (!appData) return null;

    const dbPath = path.join(appData, 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb');
    if (!fs.existsSync(dbPath)) return null;

    const buf = fs.readFileSync(dbPath);
    const str = buf.toString('latin1');
    const key = 'antigravityUnifiedStateSync.oauthToken';

    let searchIdx = 0;
    while ((searchIdx = str.indexOf(key, searchIdx)) !== -1) {
      const slice = str.slice(searchIdx + key.length, searchIdx + key.length + 6000);
      const m = slice.match(/^[A-Za-z0-9+/=]{50,}/);
      if (m) {
        const b64 = m[0];
        const decoded = Buffer.from(b64, 'base64').toString('latin1');
        if (decoded.includes('oauthTokenInfoSentinelKey')) {
          const nestedMatch = decoded.match(/CoU[A-Za-z0-9+/=]+/);
          if (nestedMatch) {
            const tokenBuf = Buffer.from(nestedMatch[0], 'base64').toString('latin1');
            const accessMatch = tokenBuf.match(/ya29\.[a-zA-Z0-9_\-]+/);
            const refreshMatch = tokenBuf.match(/1\/\/[a-zA-Z0-9_\-]+/);
            if (accessMatch || refreshMatch) {
              return {
                accessToken: accessMatch ? accessMatch[0] : null,
                refreshToken: refreshMatch ? refreshMatch[0] : null,
                source: 'local-antigravity',
                detectedAt: Date.now(),
              };
            }
          }
        }
      }
      searchIdx += key.length;
    }
  } catch (err) {
    console.error('[agy-quota] Error extracting Antigravity token:', err.message);
  }
  return null;
}

/**
 * Exchange refresh_token for a fresh access_token via Google OAuth token endpoint
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new Error('No refresh token provided');
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
    throw new Error('AGY_OAUTH_CLIENT_ID and AGY_OAUTH_CLIENT_SECRET must be configured in .env to refresh tokens');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to refresh token');
  }

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000),
  };
}

/**
 * Exchange auth code for tokens
 */
async function exchangeCodeForTokens(code, redirectUri) {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
    throw new Error('AGY_OAUTH_CLIENT_ID and AGY_OAUTH_CLIENT_SECRET are required in .env');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000),
  };
}

// Active OAuth local server instance if one is waiting
let activeOAuthServer = null;

/**
 * Start a temporary HTTP server on localhost to capture Google OAuth callback.
 */
function startOAuthLogin() {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
    return Promise.reject(new Error('AGY_OAUTH_CLIENT_ID and AGY_OAUTH_CLIENT_SECRET are required in .env for Google OAuth login'));
  }
  return new Promise((resolve, reject) => {
    if (activeOAuthServer) {
      try { activeOAuthServer.close(); } catch (_) {}
      activeOAuthServer = null;
    }

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://localhost:${server.address().port}`);
        if (reqUrl.pathname === '/oauth-callback') {
          const code = reqUrl.searchParams.get('code');
          const error = reqUrl.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h3>Login Failed</h3><p>Google returned error: ${error}</p><script>setTimeout(() => window.close(), 3000);</script>`);
            return;
          }

          if (code) {
            const redirectUri = `http://localhost:${server.address().port}/oauth-callback`;
            const tokens = await exchangeCodeForTokens(code, redirectUri);
            
            saveStoredAuth({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
              source: 'oauth',
            });

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head><title>Login Successful</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #111; color: #eee;">
                <h2 style="color: #4ade80;">Login Successful!</h2>
                <p>Antigravity Quota Monitor is now authenticated.</p>
                <p>You can close this tab and return to DeepSeek Harness.</p>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'agy-quota-auth-complete' }, '*');
                  }
                  setTimeout(() => window.close(), 2000);
                </script>
              </body>
              </html>
            `);

            setTimeout(() => {
              try { server.close(); } catch (_) {}
              activeOAuthServer = null;
            }, 1000);
            return;
          }
        }
        res.writeHead(404);
        res.end('Not found');
      } catch (err) {
        console.error('[agy-quota] OAuth callback error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h3>Server Error</h3><p>${err.message}</p>`);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      activeOAuthServer = server;
      const redirectUri = `http://localhost:${port}/oauth-callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: OAUTH_SCOPES,
        access_type: 'offline',
        prompt: 'consent',
      }).toString();

      resolve({ authUrl, port, redirectUri });
    });

    server.on('error', (err) => {
      reject(err);
    });

    // Timeout server after 3 minutes if unused
    setTimeout(() => {
      if (activeOAuthServer === server) {
        try { server.close(); } catch (_) {}
        activeOAuthServer = null;
      }
    }, 180000);
  });
}

/**
 * Get an active, valid access token.
 * Tries in order:
 * 1. Stored auth (if valid or refreshable)
 * 2. Antigravity IDE auto-detected auth (refreshed if needed)
 */
async function getValidAuth(forceDetect = false) {
  let auth = forceDetect ? null : loadStoredAuth();

  // If no stored auth, check environment variables
  if (!auth && (process.env.AGY_REFRESH_TOKEN || process.env.AGY_ACCESS_TOKEN)) {
    auth = {
      accessToken: process.env.AGY_ACCESS_TOKEN || null,
      refreshToken: process.env.AGY_REFRESH_TOKEN || null,
      source: 'env',
      expiresAt: process.env.AGY_ACCESS_TOKEN ? Date.now() + 3600 * 1000 : null,
    };
  }

  // If no stored auth or forceDetect, try local Antigravity
  if (!auth) {
    const local = extractAntigravityToken();
    if (local) {
      auth = {
        accessToken: local.accessToken,
        refreshToken: local.refreshToken,
        source: 'local-antigravity',
        expiresAt: Date.now() + 1800 * 1000,
      };
      saveStoredAuth(auth);
    }
  }

  if (!auth) {
    return null;
  }

  // Check if access token is fresh (buffer of 60 seconds)
  if (auth.accessToken && auth.expiresAt && auth.expiresAt > Date.now() + 60000) {
    return auth;
  }

  // Refresh if refresh_token is available
  if (auth.refreshToken) {
    try {
      const refreshed = await refreshAccessToken(auth.refreshToken);
      auth.accessToken = refreshed.accessToken;
      auth.expiresAt = refreshed.expiresAt;
      saveStoredAuth(auth);
      return auth;
    } catch (err) {
      console.warn('[agy-quota] Refresh token failed, re-scanning local Antigravity:', err.message);
      const local = extractAntigravityToken();
      if (local) {
        if (local.refreshToken && local.refreshToken !== auth.refreshToken) {
          try {
            const refreshed = await refreshAccessToken(local.refreshToken);
            auth = {
              accessToken: refreshed.accessToken,
              refreshToken: local.refreshToken,
              expiresAt: refreshed.expiresAt,
              source: 'local-antigravity',
            };
            saveStoredAuth(auth);
            return auth;
          } catch (_) {}
        }
        if (local.accessToken) {
          auth = {
            accessToken: local.accessToken,
            refreshToken: local.refreshToken || null,
            source: 'local-antigravity',
            expiresAt: Date.now() + 1800 * 1000,
          };
          saveStoredAuth(auth);
          return auth;
        }
      }
    }
  }

  // If we only have accessToken without expiration, return it
  if (auth.accessToken) {
    return auth;
  }

  return null;
}

module.exports = {
  getStoragePath,
  loadStoredAuth,
  saveStoredAuth,
  clearStoredAuth,
  extractAntigravityToken,
  refreshAccessToken,
  startOAuthLogin,
  getValidAuth,
  OAUTH_CLIENT_ID,
};
