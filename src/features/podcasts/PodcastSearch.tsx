import React, { useState } from 'react';
import { Search, Loader2, Podcast, Radio } from 'lucide-react';
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
const categories = ['Technology', 'Comedy', 'True Crime', 'News', 'Business', 'Science', 'History', 'Health & Fitness', 'Arts', 'Music'];

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

  const handleCategoryClick = (category: string) => {
    setQuery(category);
    fetchPodcasts(category);
  };

  const handleLoadMore = () => {
    const nextLength = results.length + PAGE_SIZE;
    setResults(allResults.slice(0, nextLength));
    setHasMore(allResults.length > nextLength);
  };

  return (
    <div className="space-y-8">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-accent-violet/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <Radio size={14} /> Podcast studio
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
              Trouve les émissions qui méritent vraiment ton <span className="text-gradient-aurora">attention</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Recherche sur iTunes, ouvre les flux RSS et ajoute les podcasts à ton espace Omed sans perdre le fil.
            </p>
          </div>

          <form onSubmit={handleSearch} className="surface-card rounded-[1.75rem] p-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={21} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un podcast, un sujet, une voix..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-28 text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="command-button absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-xl px-4 py-2 text-sm font-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {error && <div className="rounded-3xl border border-accent-rose/20 bg-accent-rose/10 p-4 text-accent-rose">{error}</div>}

      {loading && results.length === 0 && (
        <div className="surface-card flex items-center gap-3 rounded-3xl p-5 text-text-muted">
          <Loader2 size={20} className="animate-spin text-accent-cyan" />
          <span>Recherche de podcasts en cours...</span>
        </div>
      )}

      {results.length === 0 && !loading && !error && !lastSearch && (
        <section className="surface-card rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Explorer vite</p>
              <h2 className="text-2xl font-black text-text-primary">Catégories populaires</h2>
            </div>
            <Podcast size={34} className="text-accent-violet" />
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent-cyan/40 hover:bg-accent-cyan/15 hover:text-accent-cyan"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-black/15 p-8 text-center text-text-muted">
            <Podcast size={64} className="mx-auto mb-4 text-text-muted/40" />
            <p className="text-lg font-bold text-text-primary">Commence par une recherche ou une catégorie.</p>
            <p className="mt-2 text-sm">Les résultats apparaîtront sous forme de cartes avec jaquettes et accès direct aux épisodes.</p>
          </div>
        </section>
      )}

      {results.length === 0 && !loading && !error && lastSearch && (
        <div className="surface-card rounded-3xl p-8 text-center text-text-muted">
          Aucun résultat trouvé pour <span className="font-bold text-text-primary">{lastSearch}</span>.
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Résultats</p>
              <h2 className="text-2xl font-black text-text-primary">{lastSearch}</h2>
            </div>
            <span className="font-mono text-sm text-text-muted">{results.length} podcasts affichés</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {results.map((podcast) => (
              <article 
                key={podcast.collectionId} 
                className="group surface-card cursor-pointer overflow-hidden rounded-[1.75rem] p-3 transition-all hover:-translate-y-1 hover:border-white/20"
                onClick={() => navigate(`/podcasts/${podcast.collectionId}`, { state: { podcast } })}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[1.35rem] bg-white/5 shadow-lg">
                  <img 
                    src={podcast.artworkUrl600} 
                    alt={podcast.collectionName} 
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="inline-flex rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      Podcast
                    </div>
                  </div>
                </div>
                <div className="px-1 py-4">
                  <h3 className="line-clamp-2 text-sm font-black text-text-primary" title={podcast.collectionName}>
                    {podcast.collectionName}
                  </h3>
                  <p className="mt-2 truncate text-xs text-text-muted" title={podcast.artistName}>
                    {podcast.artistName}
                  </p>
                  {podcast.genres.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {podcast.genres.slice(0, 2).map((genre) => (
                        <span key={genre} className="rounded-full bg-white/7 px-2 py-1 text-[10px] font-bold text-text-muted">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4 pb-12">
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="surface-card inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent-cyan/30 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Afficher plus
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
