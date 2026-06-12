import React, { useState, useEffect, useCallback } from 'react';
import { Play, Loader2, ArrowLeft, Heart, RefreshCw, Bell, BellOff, CheckCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseRSSFeed, type PodcastEpisode } from '../../utils/rssParser';
import { type Track } from '../../store/usePlayerStore';
import { usePodcastStore } from '../../store/usePodcastStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { audioEngine } from '../../core/audio_engine';

export const PodcastDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const podcast = location.state?.podcast;

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(300);
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
    
    try {
      let feedUrl = podcast.feedUrl;

      // If feedUrl is missing, try fetching it via lookup
      if (!feedUrl) {
        const lookupResponse = await fetch(`/itunes-proxy/lookup?id=${podcast.collectionId}&entity=podcast`);
        if (!lookupResponse.ok) throw new Error('Failed to fetch podcast details from iTunes');
        const lookupData = await lookupResponse.json();
        
        if (lookupData.results && lookupData.results.length > 0) {
           feedUrl = lookupData.results[0].feedUrl;
        } else {
           throw new Error('Podcast feed URL not found');
        }
      }

      const data = await parseRSSFeed(feedUrl, podcast.artworkUrl600, podcast.collectionName);
      setEpisodes(data);
    } catch (err: unknown) {
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
              feedUrl: podcast.feedUrl
          });
      }
  };

  const unplayedCount = episodes.filter(ep => !playedEpisodes[ep.id]).length;

  if (!podcast) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-text-muted">Aucun podcast sélectionné.</p>
        <button onClick={() => navigate('/podcasts')} className="text-accent-cyan hover:underline">Retour à la recherche</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors bg-white/5 px-4 py-2 rounded-lg w-fit"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 max-w-sm sticky top-6">
          <div className="aspect-square w-full rounded-2xl overflow-hidden shadow-2xl glow-cyan mb-6">
            <img src={podcast.artworkUrl600} alt={podcast.collectionName} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-display font-bold text-text-primary mb-2">{podcast.collectionName}</h1>
          <p className="text-lg text-text-muted mb-4">{podcast.artistName}</p>
          
          <button 
             onClick={handleToggleSubscribe}
             className={`flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold mb-6 transition-all shadow-lg ${isSub ? 'bg-white/10 text-text-primary hover:bg-white/20 border border-white/10' : 'bg-gradient-to-r from-accent-cyan to-accent-violet text-bg-primary hover:opacity-90'}`}
          >
             {isSub ? (
                 <>
                     <BellOff size={20} />
                     Se désabonner
                 </>
             ) : (
                 <>
                     <Bell size={20} />
                     S'abonner
                 </>
             )}
          </button>

          <div className="flex flex-wrap gap-2 mb-6">
             {podcast.genres?.slice(0, 3).map((genre: string, i: number) => (
                <span key={i} className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-text-primary">{genre}</span>
             ))}
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-2">
            <h2 className="text-xl font-display font-semibold">Épisodes</h2>
            {isSub && !loading && episodes.length > 0 && (
               <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium text-accent-cyan flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
                 </span>
                 {unplayedCount} nouveaux non joués
               </div>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-accent-cyan" size={32} />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-start gap-4 text-accent-rose bg-accent-rose/10 p-4 rounded-lg">
              <p>{error}</p>
              <button 
                onClick={fetchEpisodes} 
                className="flex items-center gap-2 bg-accent-rose text-bg-primary px-4 py-2 rounded-lg font-medium hover:bg-accent-rose/80 transition-colors"
              >
                <RefreshCw size={16} />
                Réessayer la connexion
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {episodes.slice(0, visibleCount).map((episode) => {
                const isPlayed = playedEpisodes[episode.id];
                return (
                <div key={episode.id} className={`group bg-glass p-4 rounded-xl transition-colors border-l-4 border-transparent hover:border-accent-cyan ${isPlayed ? 'opacity-60' : 'hover:bg-white/10'}`}>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handlePlayEpisode(episode)}
                      className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-text-primary hover:bg-accent-cyan hover:text-bg-primary transition-colors"
                    >
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </button>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">{episode.title}</h3>
                      <p className="text-sm text-text-muted line-clamp-2 mb-3">{episode.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
                        <span>{episode.pubDate}</span>
                        {episode.duration > 0 && (
                          <span>{Math.floor(episode.duration / 60)} min</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(episode.id); }}
                        className={`transition-colors p-2 rounded-full opacity-0 group-hover:opacity-100 ${favorites.includes(episode.id) ? 'text-accent-rose opacity-100' : 'text-text-muted hover:text-accent-rose hover:bg-white/5'}`}
                        title="Ajouter aux favoris"
                      >
                        <Heart size={20} fill={favorites.includes(episode.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsPlayed(episode.id); }}
                        className={`transition-colors p-2 rounded-full ${isPlayed ? 'text-accent-cyan opacity-100' : 'text-text-muted hover:text-accent-cyan hover:bg-white/5 opacity-0 group-hover:opacity-100'}`}
                        title={isPlayed ? "Lu" : "Marquer comme lu"}
                      >
                         <CheckCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
              
              {episodes.length > 0 && (
                <div className="flex flex-col items-center pt-8 pb-4 gap-4">
                  <span className="text-sm text-text-muted font-mono">
                    Affichage de {Math.min(visibleCount, episodes.length)} sur {episodes.length} épisodes
                  </span>
                  {episodes.length > visibleCount && (
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 text-text-primary rounded-xl font-medium transition-all shadow-lg hover:shadow-xl border border-white/5"
                    >
                      Afficher plus d'épisodes
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
