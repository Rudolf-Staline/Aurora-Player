const isValidDriveFileId = (value) => {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{10,}$/.test(value);
};

const normalizeParam = (value) => Array.isArray(value) ? value[0] : value;

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fileId = normalizeParam(req.query.fileId);
  const token = normalizeParam(req.query.token);

  if (!isValidDriveFileId(fileId)) {
    return res.status(400).json({ error: 'Invalid or missing fileId' });
  }

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing Google Drive token' });
  }

  try {
    const upstreamHeaders = {
      Authorization: `Bearer ${token}`,
    };

    const range = req.headers.range;
    if (range) upstreamHeaders.Range = range;

    const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      method: req.method,
      headers: upstreamHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ];

    for (const header of passthroughHeaders) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(text || `Drive stream failed with status ${upstream.status}`);
    }

    if (req.method === 'HEAD') {
      return res.status(upstream.status).end();
    }

    const arrayBuffer = await upstream.arrayBuffer();
    return res.status(upstream.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Drive stream timed out' : 'Drive stream failed',
    });
  }
}
