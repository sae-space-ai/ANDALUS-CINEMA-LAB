import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string | null;
  fileName?: string;
  isLoading?: boolean;
  loadingStatus?: string;
}

export function VideoPlayer({ videoUrl, fileName, isLoading, loadingStatus }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = time;
    setProgress(parseFloat(e.target.value));
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = fileName || 'andalus-cinema-scene.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-andalus-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-andalus-300 font-medium">Generando vídeo...</p>
            <p className="text-gray-500 text-sm mt-1">{loadingStatus || 'Procesando'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-gray-900/50 rounded-xl border border-gray-800 border-dashed flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
            <Play className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">El vídeo aparecerá aquí tras la generación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
          onClick={togglePlay}
        />

        {/* Overlay controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Progress bar */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-andalus-400 [&::-webkit-slider-thumb]:rounded-full"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-andalus-400 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-andalus-400 transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs text-gray-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleFullscreen} className="text-white hover:text-andalus-400 transition-colors">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {fileName || 'andalus-cinema-scene.mp4'}
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-andalus-600 hover:bg-andalus-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Descargar MP4
        </button>
      </div>
    </div>
  );
}
