/**
 * UniversalReactPlayer.jsx
 * Advanced Multi-Source Playback Engine using react-player.
 * Supports: YouTube, YouTube Music, Vimeo, SoundCloud, and direct MP3/MP4 streams.
 */
import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { usePlayer } from '../context/usePlayer';

export default function UniversalReactPlayer({ showVideo = false }) {
  const playerRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    setCurrentTime,
    setDuration,
    setProgressState,
    handleTrackEnd,
  } = usePlayer();

  // Determine media URL to play
  let mediaUrl = null;
  if (currentTrack) {
    if (currentTrack.videoId) {
      mediaUrl = `https://www.youtube.com/watch?v=${currentTrack.videoId}`;
    } else if (currentTrack.audio_url && (currentTrack.audio_url.startsWith('http') || currentTrack.audio_url.startsWith('/'))) {
      mediaUrl = currentTrack.audio_url;
    }
  }

  // Handle seeking when requested via context
  useEffect(() => {
    const handleGlobalSeek = (e) => {
      const targetPercent = e.detail?.percent;
      if (playerRef.current && typeof targetPercent === 'number') {
        playerRef.current.seekTo(targetPercent / 100, 'fraction');
      }
    };

    window.addEventListener('tunely-seek', handleGlobalSeek);
    return () => window.removeEventListener('tunely-seek', handleGlobalSeek);
  }, []);

  if (!mediaUrl) return null;

  return (
    <div
      className={`transition-all duration-300 ${
        showVideo
          ? 'w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/80'
          : 'fixed -bottom-32 -right-32 w-2 h-2 pointer-events-none opacity-0 overflow-hidden'
      }`}
    >
      <ReactPlayer
        ref={playerRef}
        url={mediaUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume / 100}
        playbackRate={playbackRate || 1.0}
        width="100%"
        height="100%"
        controls={showVideo}
        playsinline
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              controls: showVideo ? 1 : 0,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
            },
          },
          file: {
            attributes: {
              crossOrigin: 'anonymous',
            },
          },
        }}
        onProgress={({ played, playedSeconds }) => {
          setProgressState(played * 100);
          setCurrentTime(playedSeconds);
        }}
        onDuration={(dur) => {
          if (dur && dur > 0) {
            setDuration(dur);
          }
        }}
        onEnded={handleTrackEnd}
        onError={(err) => {
          console.warn('[ReactPlayer] Stream fallback notice:', err);
        }}
      />
    </div>
  );
}
