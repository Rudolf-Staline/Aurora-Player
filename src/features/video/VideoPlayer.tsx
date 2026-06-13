import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Maximize, PictureInPicture, Volume2, VolumeX, Upload, Clapperboard } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('Sélectionne ou dépose une vidéo');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('video/')) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoTitle(file.name);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
      }
    }
  }, [videoSrc]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFileSelect]);

  const handleInputClick = () => fileInputRef.current?.click();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    setDuration(total);
    if (total > 0) setProgress((current / total) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else if (document.pictureInPictureEnabled) await videoRef.current.requestPictureInPicture();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
            <Clapperboard size={14} /> Mode cinéma
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
            Un lecteur vidéo local, avec une présence <span className="text-gradient-aurora">cinématique</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
            Dépose un fichier, garde le contrôle sur la lecture, puis passe en plein écran ou Picture-in-Picture.
          </p>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-3 md:p-5">
        <div 
          ref={containerRef}
          className={`relative aspect-video w-full overflow-hidden rounded-[1.75rem] bg-black shadow-2xl transition-all ${isDragging ? 'ring-2 ring-accent-cyan ring-offset-4 ring-offset-bg-primary' : 'glow-cyan'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {!videoSrc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-8 text-center text-text-muted">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-accent-cyan/10 text-accent-cyan glow-cyan">
                <Upload size={42} />
              </div>
              <p className="text-xl font-black text-text-primary">Dépose une vidéo ici</p>
              <p className="mb-6 mt-2 text-sm">ou sélectionne un fichier depuis ton ordinateur.</p>
              <button onClick={handleInputClick} className="command-button rounded-2xl px-6 py-3 text-sm font-black">
                Parcourir les fichiers
              </button>
              <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="video/*" className="hidden" />
            </div>
          ) : (
            <>
              <video ref={videoRef} src={videoSrc} className="h-full w-full object-cover" onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} onClick={togglePlay} />
              <div className={`absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="surface-card mx-auto rounded-[1.5rem] p-4">
                  <h3 className="mb-3 line-clamp-1 text-sm font-black text-text-primary">{videoTitle}</h3>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-mono text-xs text-text-muted">{formatTime(currentTime)}</span>
                    <div className="relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/15" onClick={handleProgressClick}>
                      <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="w-10 font-mono text-xs text-text-muted">{formatTime(duration)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="command-button flex h-12 w-12 items-center justify-center rounded-full">
                        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <button onClick={toggleMute} className="rounded-2xl bg-white/10 p-3 text-text-primary transition-colors hover:bg-white/15">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleInputClick} className="rounded-2xl bg-white/10 p-3 text-text-primary transition-colors hover:bg-white/15" title="Changer de vidéo"><Upload size={19} /></button>
                      <button onClick={togglePiP} className="rounded-2xl bg-white/10 p-3 text-text-primary transition-colors hover:bg-white/15" title="Picture in Picture"><PictureInPicture size={19} /></button>
                      <button onClick={toggleFullScreen} className="rounded-2xl bg-white/10 p-3 text-text-primary transition-colors hover:bg-white/15" title="Plein écran"><Maximize size={19} /></button>
                    </div>
                  </div>
                </div>
              </div>
              {!isPlaying && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="surface-card flex h-24 w-24 items-center justify-center rounded-full glow-cyan">
                    <Play size={48} className="ml-2 text-accent-cyan" fill="currentColor" />
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="video/*" className="hidden" />
            </>
          )}
        </div>
      </section>
    </div>
  );
};
