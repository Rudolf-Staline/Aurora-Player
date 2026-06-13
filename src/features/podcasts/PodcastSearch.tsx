import React, { useState } from 'react';
import { Search, Loader2, Podcast } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PodcastResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl600: string;
  genres: string[];
  feedUrl?: string;
}

interface ItunesSearchResponse {
  results?: unknown[];
}

const PAGE_SIZE = 30;

const isPodcastResult = (value: unknown): value is PodcastResult => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PodcastResult>;
  return (
    typeof candidate.collectionId === 'number' &&
    typeof candidate.collectionName === 'string' &&
    typeof candidate.artistName === 'string' &&
    typeof candidate.artworkUrl600 === 'string'
  );
};

const normalizePodcastResult = (result: PodcastResult): PodcastResult => ({
  ...result,
  genres: Array.isArray(result.genres) ? result.genres : [],
});

const buildItunesSearchUrl = (searchQuery: string): string => {
  const params = new URLSearchParams({
    term: searchQuery,
    media: 'podcast',
    entity: 'podcast',
    limit: '200',
  });

  const endpoint = `https://itunes.apple.com/search?${params.toString()}`;
  return import.meta.env.DEV ? `/itunes-proxy/search?${params.toString()}` : `/api/proxy?url=${encodeURIComponent(endpoint)}`;
};

export const PodcastSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [lastSearch, setLastSearch] = useState('');
  const [allResults, setAllResults] = useState<PodcastResult[]>([]);
  const [results, setResults] = useState<PodcastResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  const fetchPodcasts = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    try {
      setLoading(true);
      setError('');
      setLastSearch(trimmedQuery);

      const response = await fetch(buildItunesSearchUrl(trimmedQuery), { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Podcast search failed with status ${response.status}`);

      const data = (await response.json()) as ItunesSearchResponse;
      const fetchedResults = (data.results || []).filter(isPodcastResult).map(normalizePodcastResult);
      
      setAllResults(fetchedResults);
      setResults(fetchedResults.slice(0, PAGE_SIZE));
      setHasMore(fetchedResults.length > PAGE_SIZE);
      
    } catch (err: unknown) {
      setAllResults([]);
      setResults([]);
      setHasMore(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch podcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPodcasts(query);
  };

  const handleLoadMore = () => {
    const nextLength = results.length + PAGE_SIZE;
    setResults(allResults.slice(0, nextLength));
    setHasMore(allResults.length > nextLength);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-4">
          <h1 className="text-3xl font-display font-bold text-text-primary">Discover Podcasts</h1>
        </div>
        <form onSubmit={handleSearch} className="relative max-w-2xl w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for podcasts..."
            className="w-full bg-glass border border-white/10 rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="text-accent-rose bg-accent-rose/10 p-4 rounded-lg">{error}</div>}

      {loading && results.length === 0 && (
        <div className="flex items-center gap-3 text-text-muted py-8">
          <Loader2 size={20} className="animate-spin text-accent-cyan" />
          <span>Searching podcasts...</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {results.map((podcast) => (
          <div 
            key={podcast.collectionId} 
            className="group bg-glass p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => navigate(`/podcasts/${podcast.collectionId}`, { state: { podcast } })}
          >
            <div className="aspect-square w-full rounded-lg overflow-hidden shadow-lg mb-4 bg-white/5">
              <img 
                src={podcast.artworkUrl600} 
                alt={podcast.collectionName} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <h3 className="font-semibold text-text-primary text-sm truncate" title={podcast.collectionName}>
              {podcast.collectionName}
            </h3>
            <p className="text-xs text-text-muted mt-1 truncate" title={podcast.artistName}>
              {podcast.artistName}
            </p>
          </div>
        ))}
        {results.length === 0 && !loading && !error && lastSearch && (
          <p className="col-span-full text-text-muted">No results found for "{lastSearch}"</p>
        )}
      </div>

      {results.length === 0 && !loading && !error && !lastSearch && (
        <div className="pt-8">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-6">Popular Categories</h2>
            <div className="flex flex-wrap gap-3">
               {['Technology', 'Comedy', 'True Crime', 'News', 'Business', 'Science', 'History', 'Health & Fitness', 'Arts', 'Music'].map(cat => (
                  <button 
                     key={cat}
                     onClick={() => {
                        setQuery(cat);
                        fetchPodcasts(cat);
                     }}
                     className="px-5 py-3 bg-white/5 hover:bg-accent-cyan hover:text-bg-primary text-text-primary rounded-xl font-medium transition-colors border border-white/10 text-sm shadow-sm"
                  >
                     {cat}
                  </button>
               ))}
            </div>
            
            <div className="mt-24 flex flex-col items-center justify-center text-text-muted/40">
                <Podcast size={80} className="mb-6 drop-shadow-lg" />
                <p className="text-lg font-medium">Search to find your favorite shows</p>
            </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col items-center pt-8 pb-12 gap-4">
          <span className="text-sm text-text-muted font-mono">Showing {results.length} podcasts</span>
          {hasMore && (
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-text-primary rounded-xl font-medium transition-all shadow-lg hover:shadow-xl border border-white/5 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
};
