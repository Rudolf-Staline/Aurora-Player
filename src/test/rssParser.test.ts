import { describe, expect, it } from 'vitest';
import { formatPodcastDate, parsePodcastDuration, parsePodcastXML, stripHtml } from '../utils/rssParser';

describe('rssParser helpers', () => {
  it('parses podcast durations in seconds and timestamp formats', () => {
    expect(parsePodcastDuration('90')).toBe(90);
    expect(parsePodcastDuration('01:02')).toBe(62);
    expect(parsePodcastDuration('1:02:03')).toBe(3723);
    expect(parsePodcastDuration('not-a-duration')).toBe(0);
  });

  it('strips unsafe and noisy HTML from descriptions', () => {
    expect(stripHtml('<p>Hello&nbsp;<strong>world</strong>&amp; friends</p><script>alert(1)</script>')).toBe('Hello world& friends');
  });

  it('keeps invalid dates as raw text instead of returning Invalid Date', () => {
    expect(formatPodcastDate('not-a-date')).toBe('not-a-date');
  });
});

describe('parsePodcastXML', () => {
  it('parses RSS episodes and skips entries without audio URLs', () => {
    const xml = `
      <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>Omed Talks</title>
          <image><url>https://example.com/show.png</url></image>
          <item>
            <guid>episode-1</guid>
            <title>Episode One</title>
            <description><![CDATA[<p>Clean <b>description</b></p>]]></description>
            <pubDate>not-a-date</pubDate>
            <itunes:duration>01:02</itunes:duration>
            <enclosure url="https://example.com/episode-1.mp3" type="audio/mpeg" />
          </item>
          <item>
            <title>Text only</title>
          </item>
        </channel>
      </rss>
    `;

    const episodes = parsePodcastXML(xml);

    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({
      id: 'episode-1',
      title: 'Episode One',
      description: 'Clean description',
      pubDate: 'not-a-date',
      duration: 62,
      audioUrl: 'https://example.com/episode-1.mp3',
      artworkUrl: 'https://example.com/show.png',
      podcastTitle: 'Omed Talks',
    });
  });

  it('parses Atom feed entries with enclosure links', () => {
    const xml = `
      <feed>
        <title>Atom Show</title>
        <entry>
          <id>atom-episode</id>
          <title>Atom Episode</title>
          <summary>Short summary</summary>
          <updated>2026-01-01T00:00:00Z</updated>
          <link rel="enclosure" type="audio/mpeg" href="https://example.com/atom.mp3" />
        </entry>
      </feed>
    `;

    const episodes = parsePodcastXML(xml, 'https://example.com/fallback.png');

    expect(episodes).toHaveLength(1);
    expect(episodes[0].id).toBe('atom-episode');
    expect(episodes[0].audioUrl).toBe('https://example.com/atom.mp3');
    expect(episodes[0].artworkUrl).toBe('https://example.com/fallback.png');
  });

  it('throws on invalid XML', () => {
    expect(() => parsePodcastXML('<rss><channel>')).toThrow('Invalid XML feed format');
  });
});
