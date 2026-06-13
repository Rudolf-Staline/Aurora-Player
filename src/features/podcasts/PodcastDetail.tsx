import React, { useState, useEffect, useCallback } from 'react';
import { Play, Loader2, ArrowLeft, Heart, RefreshCw, Bell, BellOff, CheckCircle, Inbox, Radio } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseRSSFeed, type PodcastEpisode } from '../../utils/rssParser';
import { type Track } from '../../store/usePlayerStore';
import { usePodcastStore } from '../../store/usePodcastStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { audioEngine } from '../../core/audio_engine';

interface PodcastDetailState {
  podcast?: {
    collectionId: number;
    collectionName: string;
    artistName: string;
    artworkUrl600: string;
    genres?: string[];
    feedUrl?: string;
  };
}

interface ItunesLookupResponse {
  results?: unknown[];
}

interface ItunesLookupResult {
  feedUrl?: string;
}

const INITIAL_VISIBLE_EPISODES = 100;
const VISIBLE_EPISODE_INCREMENT = 50;

const isLookupResult = (value: unknown): value is ItunesLookupResult => {
  return Boolean(value && typeof value === 'object' && 'feedUrl' in value);
};

const buildItunesLookupUrl = (collectionId: number): string => {
  const endpoint = `https://itunes.apple.com/lookup?id=${collectionId}&entity=podcast`;
  return import.meta.env.DEV ? `/itunes-proxy/lookup?id=${collectionId}&entity=podcast` : `/api/proxy?url=${encodeURIComponent(endpoint)}`;
};

const resolvePodcastFeedUrl = async (collectionId: number, feedUrl?: string): Promise<string> => {
  if (feedUrl?.trim()) return feedUrl;

  const lookupResponse = await fetch(buildItunesLookupUrl(collectionId), { signal: AbortSignal.timeout(15000) });
  if (!lookupResponse.ok) throw new Error('Failed to fetch podcast details from iTunes');

  const lookupData = (await lookupResponse.json()) as ItunesLookupResponse;
  const lookupResult = lookupData.results?.find(isLookupResult);

  if (!lookupResult?.feedUrl) {
    throw new Error('Podcast feed URL not found');
  }

  return lookupResult.feedUrl;
};

export const PodcastDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const podcast = (location.state as PodcastDetailState | null)?.podcast;

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_EPISODES);
  const { episodeIds: favorites, toggleEpisodeFavorite: toggleFavorite } = useFavoritesStore();
  const { isSubscribed, subscribe, unsubscribe, playedEpisodes, markAsPlayed } = usePodcastStore();

  const fetchEpisodes = useCallback(async () => {
    if (!podcast || !podcast.collectionId) {
      setError('Invalid podcast data.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setVisibleCount(INITIAL_VISIBLE_EPISODES);
    
    try {
      const feedUrl = await resolvePodcastFeedUrl(podcast.collectionId, podcast.feedUrl);
      const data = await parseRSSFeed(feedUrl, podcast.artworkUrl600, podcast.collectionName);
      setEpisodes(data);
    } catch (err: unknown) {
      setEpisodes([]);
      setError(err instanceof Error ? err.message : 'Failed to load episodes');
    } finally {
      setLoading(false);
    }
  }, [podcast]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handlePlayEpisode = (episode: PodcastEpisode) => {
    const track: Track = {
      id: episode.id,
      title: episode.title,
      artist: episode.podcastTitle,
      album: 'Podcast Episode',
      url: episode.audioUrl,
      artworkUrl: episode.artworkUrl,
      duration: episode.duration,
    };
    audioEngine.playAndStart(track);
    markAsPlayed(episode.id);
  };

  const isSub = podcast ? isSubscribed(podcast.collectionId) : false;
  
  const handleToggleSubscribe = () => {
      if (!podcast) return;
      if (isSub) {
          unsubscribe(podcast.collectionId);
      } else {
          subscribe({
              collectionId: podcast.collectionId,
              collectionName: podcast.collectionName,
              artistName: podcast.artistName,
              artworkUrl600: podcast.artworkUrl600,
              feedUrl: podcast.feedUrl ?? ''
          });
      }
  };

  const unplayedCount = episodes.filter(ep => !playedEpisodes[ep.id]).length;

  if (!podcast) {
    return (
      <div className="surface-card flex min-h-[50vh] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
        <Inbox size={46} className="mb-4 text-text-muted" />
        <p className="text-lg font-bold text-text-primary">Aucun podcast sélectionné.</p>
        <button onClick={() => navigate('/podcasts')} className="mt-4 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-bold text-accent-cyan hover:bg-white/[0.12]">Retour à la recherche</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <button 
        onClick={() => navigate(-1)} 
        className="surface-card inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[260px_1fr] lg:items-end">
          <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-[2rem] bg-white/[0.06] shadow-2xl shadow-black/40">
            <img src={podcast.artworkUrl600} alt={podcast.collectionName} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <Radio size={14} /> Podcast
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">{podcast.collectionName}</h1>
            <p className="mt-3 text-lg text-text-muted">{podcast.artistName}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button 
                onClick={handleToggleSubscribe}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all ${isSub ? 'border border-white/10 bg-white/[0.08] text-text-primary hover:bg-white/[0.12]' : 'command-button'}`}
              >
                {isSub ? <BellOff size={19} /> : <Bell size={19} />}
                {isSub ? 'Se désabonner' : "S'abonner"}
              </button>
              <div className="flex flex-wrap gap-2">
                {podcast.genres?.slice(0, 4).map((genre: string) => (
                  <span key={genre} className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-bold text-text-muted ring-1 ring-white/10">{genre}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-4 md:p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Flux RSS</p>
            <h2 className="text-2xl font-black text-text-primary">Épisodes</h2>
          </div>
          {isSub && !loading && episodes.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-cyan/10 px-3 py-1.5 text-sm font-bold text-accent-cyan">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
              </span>
              {unplayedCount} non joués
            </div>
          )}
        </div>
        
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-text-muted">
            <Loader2 className="animate-spin text-accent-cyan" size={28} />
            <span>Chargement des épisodes...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-accent-rose/20 bg-accent-rose/10 p-5 text-accent-rose">
            <p>{error}</p>
            <button 
              onClick={fetchEpisodes} 
              className="inline-flex items-center gap-2 rounded-2xl bg-accent-rose px-4 py-2 text-sm font-black text-bg-primary transition-opacity hover:opacity-85"
            >
              <RefreshCw size={16} />
              Réessayer la connexion
            </button>
          </div>
        )}

        {!loading && !error && episodes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 py-16 text-center text-text-muted">
            <Inbox size={42} className="mb-4 opacity-60" />
            <p className="font-bold text-text-primary">Aucun épisode lisible trouvé</p>
            <p className="mt-2 max-w-md text-sm">Le flux existe peut-être, mais aucun épisode avec fichier audio n'a été détecté.</p>
          </div>
        )}

        {!loading && !error && episodes.length > 0 && (
          <div className="space-y-3">
            {episodes.slice(0, visibleCount).map((episode) => {
              const isPlayed = playedEpisodes[episode.id];
              return (
              <article key={episode.id} className={`group rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-accent-cyan/35 hover:bg-white/[0.07] ${isPlayed ? 'opacity-60' : ''}`}>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handlePlayEpisode(episode)}
                    className="command-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
                    aria-label={`Lire ${episode.title}`}
                  >
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-black text-text-primary">{episode.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{episode.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-text-muted">
                      {episode.pubDate && <span>{episode.pubDate}</span>}
                      {episode.duration > 0 && <span>{Math.floor(episode.duration / 60)} min</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(episode.id); }}
                      className={`rounded-2xl p-2 transition-colors ${favorites.includes(episode.id) ? 'bg-accent-rose/15 text-accent-rose' : 'text-text-muted hover:bg-white/[0.08] hover:text-accent-rose'}`}
                      title="Ajouter aux favoris"
                    >
                      <Heart size={20} fill={favorites.includes(episode.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsPlayed(episode.id); }}
                      className={`rounded-2xl p-2 transition-colors ${isPlayed ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:bg-white/[0.08] hover:text-accent-cyan'}`}
                      title={isPlayed ? 'Lu' : 'Marquer comme lu'}
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
            
            <div className="flex flex-col items-center gap-4 pt-8 pb-4">
              <span className="font-mono text-sm text-text-muted">
                Affichage de {Math.min(visibleCount, episodes.length)} sur {episodes.length} épisodes
              </span>
              {episodes.length > visibleCount && (
                <button 
                  onClick={() => setVisibleCount(prev => prev + VISIBLE_EPISODE_INCREMENT)}
                  className="surface-card rounded-2xl px-6 py-3 text-sm font-black text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent-cyan/35"
                >
                  Afficher plus d'épisodes
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
