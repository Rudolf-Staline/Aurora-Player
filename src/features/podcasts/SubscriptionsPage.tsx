import React, { useEffect, useState } from 'react';
import { usePodcastStore } from '../../store/usePodcastStore';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { parseRSSFeed } from '../../utils/rssParser';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, playedEpisodes, markAllAsPlayed } = usePodcastStore();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const newCounts: Record<number, number> = {};
      
      for (const sub of subscriptions) {
         try {
             let feedUrl = sub.feedUrl;
             if (!feedUrl) {
                const lookupResponse = await fetch(`/itunes-proxy/lookup?id=${sub.collectionId}&entity=podcast`);
                const lookupData = await lookupResponse.json();
                if (lookupData.results && lookupData.results.length > 0) {
                   feedUrl = lookupData.results[0].feedUrl;
                }
             }
             if (feedUrl) {
                const episodes = await parseRSSFeed(feedUrl);
                const unplayedCount = episodes.filter(ep => !playedEpisodes[ep.id]).length;
                newCounts[sub.collectionId] = unplayedCount;
             }
         } catch {
             console.error(`Failed to fetch count for ${sub.collectionName}`);
         }
      }
      setCounts(newCounts);
      setLoading(false);
    };

    if (subscriptions.length > 0) {
        fetchCounts();
    }
  }, [subscriptions, playedEpisodes]);

  const handleMarkAllPlayed = async (collectionId: number) => {
      const sub = subscriptions.find(s => s.collectionId === collectionId);
      if (!sub) return;
      
      try {
             let feedUrl = sub.feedUrl;
             if (!feedUrl) {
                const lookupResponse = await fetch(`/itunes-proxy/lookup?id=${sub.collectionId}&entity=podcast`);
                const lookupData = await lookupResponse.json();
                if (lookupData.results && lookupData.results.length > 0) {
                   feedUrl = lookupData.results[0].feedUrl;
                }
             }
             if (feedUrl) {
                const episodes = await parseRSSFeed(feedUrl);
                const episodeIds = episodes.map(ep => ep.id);
                markAllAsPlayed(collectionId, episodeIds);
             }
         } catch {
             console.error(`Failed to fetch episodes to mark as played`);
         }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <Bell className="text-accent-violet" size={28} />
            Subscriptions
        </h1>
        {loading && <Loader2 className="animate-spin text-accent-violet" size={20} />}
      </div>

      {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4">
             <Bell size={48} className="opacity-20" />
             <p>You haven't subscribed to any podcasts yet.</p>
             <button onClick={() => navigate('/podcasts')} className="text-accent-cyan hover:underline mt-2">Discover Podcasts</button>
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {subscriptions.map((sub) => {
                const unplayed = counts[sub.collectionId] || 0;
                return (
                  <div key={sub.collectionId} className="group relative bg-glass rounded-xl overflow-hidden hover:bg-white/10 transition-colors border border-transparent hover:border-accent-violet/50 shadow-lg">
                     <div 
                         className="cursor-pointer"
                         onClick={() => navigate(`/podcasts/${sub.collectionId}`, { state: { podcast: sub } })}
                     >
                         <div className="aspect-square w-full relative">
                           <img 
                             src={sub.artworkUrl600} 
                             alt={sub.collectionName} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                           />
                           {unplayed > 0 && (
                               <div className="absolute top-2 right-2 bg-accent-violet text-bg-primary font-bold text-xs px-2 py-1 rounded-full shadow-lg">
                                   {unplayed} new
                               </div>
                           )}
                         </div>
                         <div className="p-4">
                           <h3 className="font-semibold text-text-primary text-sm truncate" title={sub.collectionName}>
                             {sub.collectionName}
                           </h3>
                           <p className="text-xs text-text-muted mt-1 truncate" title={sub.artistName}>
                             {sub.artistName}
                           </p>
                           <p className="text-[10px] text-text-muted/60 mt-3 font-mono">
                             Subscribed: {new Date(sub.subscribedAt).toLocaleDateString()}
                           </p>
                         </div>
                     </div>
                     <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                             onClick={(e) => { e.stopPropagation(); handleMarkAllPlayed(sub.collectionId); }}
                             className="p-2 bg-black/50 hover:bg-accent-cyan text-white hover:text-black rounded-full backdrop-blur transition-colors"
                             title="Mark all as played"
                         >
                             <CheckCircle size={16} />
                         </button>
                     </div>
                  </div>
                );
            })}
          </div>
      )}
    </div>
  );
};
