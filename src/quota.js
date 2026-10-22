/**
 * Antigravity Quota Service
 * Communicates with Google Cloud Code internal APIs (daily-cloudcode-pa / cloudcode-pa)
 * matching Antigravity IDE behavior.
 */

const ENDPOINTS = [
  'https://daily-cloudcode-pa.googleapis.com',
  'https://cloudcode-pa.googleapis.com',
];

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'antigravity/2.5.5 windows/amd64',
  'Accept': 'application/json',
};

/**
 * Fetch quota summary from Google Cloud Code internal APIs.
 * Tries daily-cloudcode-pa first (consumer / Google AI Pro accounts),
 * falls back to cloudcode-pa (GCP TOS enterprise accounts).
 */
async function fetchUserQuotaSummary(accessToken) {
  let lastError = null;

  for (const baseUrl of ENDPOINTS) {
    try {
      const url = `${baseUrl}/v1internal:retrieveUserQuotaSummary`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...COMMON_HEADERS,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ project: 'aicode-consumers' }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const plan = await fetchPlanInfo(accessToken, baseUrl).catch(() => null);
        return normalizeQuotaData(data, plan, baseUrl);
      } else {
        const text = await res.text();
        lastError = new Error(`Endpoint ${baseUrl} returned ${res.status}: ${text}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All quota endpoints failed');
}

/**
 * Fetch plan tier info (e.g. Google AI Pro / Free) via loadCodeAssist
 */
async function fetchPlanInfo(accessToken, baseUrl = ENDPOINTS[0]) {
  try {
    const url = `${baseUrl}/v1internal:loadCodeAssist`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...COMMON_HEADERS,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        metadata: {
          ideName: 'antigravity',
          ideType: 9,
          ideVersion: '2.5.5',
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const rawUri = data.paidTier?.upgradeSubscriptionUri || data.currentTier?.upgradeSubscriptionUri || '';
      const safeUpgradeUri = typeof rawUri === 'string' && /^https?:\/\//i.test(rawUri) ? rawUri : '';

      return {
        tierId: data.paidTier?.id || data.currentTier?.id || 'free-tier',
        tierName: data.paidTier?.name || data.currentTier?.name || 'Google AI Free',
        upgradeText: data.paidTier?.upgradeSubscriptionText || data.currentTier?.upgradeSubscriptionText || '',
        upgradeUri: safeUpgradeUri,
      };
    }
  } catch (err) {
    console.warn('[agy-quota] Could not fetch plan info:', err.message);
  }
  return null;
}

/**
 * Fetch Google User Profile (email, name, picture)
 */
async function fetchUserProfile(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const info = await res.json();
      const rawPic = info.picture;
      const safePic = typeof rawPic === 'string' && /^https:\/\//i.test(rawPic) ? rawPic : null;

      return {
        email: typeof info.email === 'string' ? info.email : null,
        name: typeof info.name === 'string' ? info.name : null,
        picture: safePic,
      };
    }
  } catch (err) {
    console.warn('[agy-quota] Could not fetch user profile:', err.message);
  }
  return null;
}

function formatDuration(targetIso) {
  if (!targetIso) return null;
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return 'Ready';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function normalizeQuotaData(raw, plan = null, endpointUsed = null) {
  const rawGroups = Array.isArray(raw.groups) ? raw.groups : [];

  // Flatten all buckets
  const allBuckets = [];
  for (const g of rawGroups) {
    if (Array.isArray(g.buckets)) {
      for (const b of g.buckets) {
        allBuckets.push({
          ...b,
          groupName: g.displayName,
        });
      }
    }
  }

  const parseBucket = (id) => {
    const b = allBuckets.find(item => item.bucketId === id);
    if (!b) return null;

    const fraction = typeof b.remainingFraction === 'number' ? b.remainingFraction : 0;
    const percentage = Math.round(fraction * 100);
    const resetTime = b.resetTime || null;
    const resetFormatted = formatDuration(resetTime);

    return {
      bucketId: b.bucketId,
      displayName: b.displayName || id,
      window: b.window || (id.includes('weekly') ? 'weekly' : '5h'),
      remainingFraction: fraction,
      percentage,
      resetTime,
      resetFormatted,
      description: b.description || '',
    };
  };

  const geminiWeekly = parseBucket('gemini-weekly') || {
    bucketId: 'gemini-weekly',
    displayName: 'Weekly Limit Remaining',
    window: 'weekly',
    remainingFraction: 1,
    percentage: 100,
    resetTime: null,
    resetFormatted: 'Full',
    description: '',
  };

  const gemini5h = parseBucket('gemini-5h') || {
    bucketId: 'gemini-5h',
    displayName: 'Five Hour Limit Remaining',
    window: '5h',
    remainingFraction: 1,
    percentage: 100,
    resetTime: null,
    resetFormatted: 'Full',
    description: '',
  };

  const claude3pWeekly = parseBucket('3p-weekly');
  const claude3p5h = parseBucket('3p-5h');

  return {
    plan: plan || {
      tierId: 'unknown',
      tierName: 'Google AI Pro',
      upgradeText: '',
      upgradeUri: '',
    },
    gemini: {
      weekly: geminiWeekly,
      fiveHour: gemini5h,
    },
    claude3p: (claude3pWeekly || claude3p5h) ? {
      weekly: claude3pWeekly,
      fiveHour: claude3p5h,
    } : null,
    description: raw.description || '',
    endpoint: endpointUsed,
    groups: rawGroups,
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  fetchUserQuotaSummary,
  fetchPlanInfo,
  fetchUserProfile,
  normalizeQuotaData,
  formatDuration,
};
