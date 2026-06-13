export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  duration: number; // in seconds
  audioUrl: string;
  artworkUrl?: string;
  podcastTitle: string;
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const firstText = (node: ParentNode, selectors: string[]): string => {
  for (const selector of selectors) {
    const text = node.querySelector(selector)?.textContent?.trim();
    if (text) return text;
  }

  return '';
};

const firstAttribute = (node: ParentNode, selectors: string[], attribute: string): string => {
  for (const selector of selectors) {
    const value = node.querySelector(selector)?.getAttribute(attribute)?.trim();
    if (value) return value;
  }

  return '';
};

export const stripHtml = (value: string): string => {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export const parsePodcastDuration = (value?: string | null): number => {
  if (!value) return 0;

  const normalized = value.trim();
  if (!normalized) return 0;

  if (!normalized.includes(':')) {
    const seconds = Number.parseInt(normalized, 10);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  }

  const parts = normalized.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;

  return parts.reduce((total, part) => total * 60 + part, 0);
};

export const formatPodcastDate = (value?: string | null): string => {
  if (!value) return '';

  const rawDate = value.trim();
  if (!rawDate) return '';

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return rawDate;

  return parsedDate.toLocaleDateString();
};

const getEpisodeAudioUrl = (item: Element): string => {
  const enclosureUrl = firstAttribute(item, ['enclosure'], 'url');
  if (enclosureUrl) return enclosureUrl;

  const mediaContentUrl = firstAttribute(item, ['media\\:content', 'content'], 'url');
  if (mediaContentUrl) return mediaContentUrl;

  const atomEnclosure = Array.from(item.querySelectorAll('link')).find((link) => {
    const rel = link.getAttribute('rel');
    const type = link.getAttribute('type') || '';
    return rel === 'enclosure' || type.startsWith('audio/');
  });

  return atomEnclosure?.getAttribute('href')?.trim() || '';
};

const getEpisodeArtwork = (item: Element, fallback?: string): string | undefined => {
  return (
    firstAttribute(item, ['itunes\\:image'], 'href') ||
    firstAttribute(item, ['media\\:thumbnail', 'media\\:content'], 'url') ||
    fallback
  );
};

const getChannelMetadata = (doc: XMLDocument, defaultArtwork?: string, podcastTitle?: string) => {
  const channel = doc.querySelector('channel');
  const feed = doc.querySelector('feed');

  const title =
    channel?.querySelector('title')?.textContent?.trim() ||
    feed?.querySelector('title')?.textContent?.trim() ||
    podcastTitle ||
    'Unknown Podcast';

  const artwork =
    (channel && (
      firstText(channel, ['image > url']) ||
      firstAttribute(channel, ['itunes\\:image'], 'href')
    )) ||
    (feed && firstAttribute(feed, ['logo', 'icon'], 'href')) ||
    defaultArtwork;

  return { title, artwork };
};

export const parsePodcastXML = (xmlText: string, defaultArtwork?: string, podcastTitle?: string): PodcastEpisode[] => {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML feed format');
  }

  const { title: channelTitle, artwork: channelArtwork } = getChannelMetadata(doc, defaultArtwork, podcastTitle);
  const entries = Array.from(doc.querySelectorAll('item, entry'));

  return entries
    .map((item, index): PodcastEpisode | null => {
      const audioUrl = getEpisodeAudioUrl(item);
      if (!isNonEmptyString(audioUrl)) return null;

      const guid = firstText(item, ['guid', 'id']);
      const rawDescription = firstText(item, ['content\\:encoded', 'summary', 'description', 'content']);
      const duration = parsePodcastDuration(firstText(item, ['itunes\\:duration']));
      const pubDate = formatPodcastDate(firstText(item, ['pubDate', 'published', 'updated']));

      return {
        id: guid || audioUrl || `episode-${index}`,
        title: firstText(item, ['title']) || `Episode ${index + 1}`,
        description: stripHtml(rawDescription),
        pubDate,
        duration,
        audioUrl,
        artworkUrl: getEpisodeArtwork(item, channelArtwork),
        podcastTitle: channelTitle,
      };
    })
    .filter((episode): episode is PodcastEpisode => episode !== null);
};

export const parseRSSFeed = async (url: string, defaultArtwork?: string, podcastTitle?: string): Promise<PodcastEpisode[]> => {
  try {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
        const response = await fetch(`/raw-proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Failed to fetch RSS feed with status ${response.status}`);
        return parsePodcastXML(await response.text(), defaultArtwork, podcastTitle);
    }

    // Production: Use our own Vercel proxy
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Proxy failed with status ${response.status}`);

        const xmlText = await response.text();
        if (xmlText && (xmlText.includes('<rss') || xmlText.includes('<feed'))) {
            return parsePodcastXML(xmlText, defaultArtwork, podcastTitle);
        }
        throw new Error('Retrieved content is not a valid RSS/Atom feed');
    } catch (e) {
        console.error(`Omed Proxy failed for ${url}`, e);
        throw e;
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw error;
  }
};
