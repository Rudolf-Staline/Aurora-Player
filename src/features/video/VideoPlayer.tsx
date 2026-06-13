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
      <section className="surface-card-strong shadow-deep relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="relative">
          <div className="eyebrow mb-5 inline-flex items-center gap-2 text-accent-primary">
            <Clapperboard size={14} /> Mode cinéma
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text-primary md:text-6xl">
            Un lecteur vidéo local, d&rsquo;une présence <span className="text-accent-primary">cinématique</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
            Dépose un fichier, garde le contrôle sur la lecture, puis passe en plein écran ou Picture-in-Picture.
          </p>
        </div>
      </section>

      <section className="surface-card shadow-deep rounded-[2rem] p-3 md:p-5">
        <div
          ref={containerRef}
          className={`shadow-deep relative aspect-video w-full overflow-hidden rounded-[1.75rem] bg-bg-primary transition-all ${isDragging ? 'border-premium-strong ring-1 ring-accent-primary/40' : 'border-premium'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {!videoSrc ? (
            <div className="surface-secondary absolute inset-0 flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-premium p-8 text-center text-text-muted">
              <div className="border-premium mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-bg-elevated text-accent-primary">
                <Upload size={40} strokeWidth={1.5} />
              </div>
              <p className="text-xl font-semibold text-text-primary">Dépose une vidéo ici</p>
              <p className="mb-6 mt-2 text-sm">ou sélectionne un fichier depuis ton ordinateur.</p>
              <button onClick={handleInputClick} className="btn-secondary rounded-2xl px-6 py-3 text-sm">
                Parcourir les fichiers
              </button>
              <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="video/*" className="hidden" />
            </div>
          ) : (
            <>
              <video ref={videoRef} src={videoSrc} className="h-full w-full object-cover" onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} onClick={togglePlay} />
              <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/90 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="surface-card-strong mx-auto rounded-[1.5rem] p-4">
                  <h3 className="eyebrow mb-3 line-clamp-1 text-text-muted">{videoTitle}</h3>
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-right font-mono text-xs text-text-muted">{formatTime(currentTime)}</span>
                    <div className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-bg-elevated" onClick={handleProgressClick}>
                      <div className="absolute left-0 top-0 h-full rounded-full bg-accent-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="w-10 font-mono text-xs text-text-muted">{formatTime(duration)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="btn-primary flex h-12 w-12 items-center justify-center rounded-full">
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <button onClick={toggleMute} className="border-premium rounded-2xl bg-bg-elevated p-3 text-text-primary transition-colors hover:bg-bg-secondary">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleInputClick} className="border-premium rounded-2xl bg-bg-elevated p-3 text-text-primary transition-colors hover:bg-bg-secondary" title="Changer de vidéo"><Upload size={19} /></button>
                      <button onClick={togglePiP} className="border-premium rounded-2xl bg-bg-elevated p-3 text-text-primary transition-colors hover:bg-bg-secondary" title="Picture in Picture"><PictureInPicture size={19} /></button>
                      <button onClick={toggleFullScreen} className="border-premium rounded-2xl bg-bg-elevated p-3 text-text-primary transition-colors hover:bg-bg-secondary" title="Plein écran"><Maximize size={19} /></button>
                    </div>
                  </div>
                </div>
              </div>
              {!isPlaying && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="surface-card-strong shadow-deep flex h-24 w-24 items-center justify-center rounded-full">
                    <Play size={44} className="ml-2 text-accent-primary" fill="currentColor" />
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
