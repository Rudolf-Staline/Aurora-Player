const REQUEST_TIMEOUT_MS = 15000;
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1']);

const isPrivateIPv4 = (hostname) => {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;

  const [, aRaw, bRaw] = match;
  const a = Number(aRaw);
  const b = Number(bRaw);

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};

const normalizeUrlParam = (value) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const validateTargetUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { error: 'Missing url parameter' };
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return { error: 'Invalid url parameter' };
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return { error: 'Only HTTP and HTTPS URLs are allowed' };
  }

  const hostname = targetUrl.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIPv4(hostname)) {
    return { error: 'Local and private network URLs are not allowed' };
  }

  return { targetUrl };
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetUrl, error } = validateTargetUrl(normalizeUrlParam(req.query.url));
  if (error) {
    return res.status(400).json({ error });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Omed-Player/1.0 (+https://github.com/Rudolf-Staline/Omed-Player)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, text/plain, */*',
      },
    });

    const data = await response.text();
    const contentType = response.headers.get('content-type') || 'text/plain; charset=utf-8';

    res.setHeader('Content-Type', contentType);

    if (!response.ok) {
      return res.status(response.status).send(data || `Failed to fetch from source: ${response.statusText}`);
    }

    return res.status(200).send(data);
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return res.status(isAbort ? 504 : 500).json({
      error: isAbort ? 'Proxy request timed out' : 'Proxy failed to fetch the URL',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
