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

export const parseRSSFeed = async (url: string, defaultArtwork?: string, podcastTitle?: string): Promise<PodcastEpisode[]> => {
  try {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
        const response = await fetch(`/raw-proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Failed to fetch RSS feed with status ${response.status}`);
        return parseXML(await response.text(), defaultArtwork, podcastTitle);
    }

    // Production: Use our own Vercel proxy
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Proxy failed with status ${response.status}`);

        const xmlText = await response.text();
        if (xmlText && (xmlText.includes('<rss') || xmlText.includes('<feed'))) {
            return parseXML(xmlText, defaultArtwork, podcastTitle);
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

const parseXML = (xmlText: string, defaultArtwork?: string, podcastTitle?: string): PodcastEpisode[] => {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Invalid XML feed format');
    }

    const channelTitle = doc.querySelector('channel > title')?.textContent || podcastTitle || 'Unknown Podcast';
    const channelArtwork = doc.querySelector('channel > image > url')?.textContent || doc.querySelector('channel > itunes\\:image')?.getAttribute('href') || defaultArtwork;

    const items = Array.from(doc.querySelectorAll('item'));
    
    const episodes: PodcastEpisode[] = items.map((item, index) => {
        const enclosure = item.querySelector('enclosure');
        const audioUrl = enclosure?.getAttribute('url') || '';
        const guid = item.querySelector('guid')?.textContent;
        
        let duration = 0;
        const itunesDuration = item.getElementsByTagName('itunes:duration')[0]?.textContent;
        if (itunesDuration) {
            if (itunesDuration.includes(':')) {
                 const parts = String(itunesDuration).split(':').reverse();
                 duration = parts.reduce((acc, part, i) => acc + parseInt(part, 10) * Math.pow(60, i), 0);
            } else {
                 duration = parseInt(itunesDuration, 10);
            }
        }

        const itunesImage = item.getElementsByTagName('itunes:image')[0]?.getAttribute('href');
        const mediaContent = item.getElementsByTagName('media:content')[0]?.getAttribute('url');

        // Extract and strip description
        const descriptionNode = item.querySelector('description');
        const contentEncoded = item.getElementsByTagName('content:encoded')[0];
        const rawDescription = contentEncoded?.textContent || descriptionNode?.textContent || '';
        const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '');

        const pubDateStr = item.querySelector('pubDate')?.textContent || '';
        let pubDate = '';
        if (pubDateStr) {
            try {
                pubDate = new Date(pubDateStr).toLocaleDateString();
            } catch {
                pubDate = pubDateStr;
            }
        }

        return {
            id: guid || audioUrl || `episode-${index}`,
            title: item.querySelector('title')?.textContent || `Episode ${index + 1}`,
            description: cleanDescription,
            pubDate: pubDate,
            duration: isNaN(duration) ? 0 : duration,
            audioUrl: audioUrl,
            artworkUrl: itunesImage || mediaContent || channelArtwork,
            podcastTitle: channelTitle
        };
    }).filter((ep: PodcastEpisode) => ep.audioUrl);
    
    return episodes;
};
