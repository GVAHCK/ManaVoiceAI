import React, { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  fileName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration = 0,
  fileName = 'manavoice_speech.wav',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(duration);
  }, [audioUrl, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="audio-player-mana">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="audio-btn"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`} />
      </button>

      {/* Timeline & Scrubber */}
      <div className="flex-grow-1 d-flex flex-column gap-1">
        <div className="d-flex align-items-center justify-content-between text-mv-deep-teal" style={{ fontSize: '0.78rem' }}>
          <span>{formatTime(currentTime)}</span>
          <span className="fw-semibold text-mv-midnight">ManaVoice Audio Output</span>
          <span>{formatTime(totalDuration || currentTime)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={totalDuration || 1}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="form-range"
          style={{ accentColor: '#3AAFA9' }}
        />
      </div>

      {/* Download Action */}
      <button
        onClick={handleDownload}
        className="btn btn-mana-outline btn-sm d-flex align-items-center gap-1"
        title="Download Audio (.wav)"
      >
        <i className="bi bi-download" />
        <span className="d-none d-sm-inline">Download</span>
      </button>
    </div>
  );
};
