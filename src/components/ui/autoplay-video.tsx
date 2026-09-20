import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AutoplayVideoProps {
  src: string
  poster?: string
  className?: string
  'aria-label'?: string
  controls?: boolean
}

export function AutoplayVideo({
  src,
  poster,
  className,
  'aria-label': ariaLabel,
  controls = true,
}: AutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const playVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      await video.play()
    } catch {
      // Autoplay may be blocked until user interaction — loop will work after first play
    }
  }, [])

  const restartVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    void playVideo()
  }, [playVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    void playVideo()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.ended) restartVideo()
          else void playVideo()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(video)

    return () => observer.disconnect()
  }, [playVideo, restartVideo])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      controls={controls}
      preload="auto"
      poster={poster}
      aria-label={ariaLabel}
      className={cn(className)}
      onEnded={restartVideo}
      onPause={(e) => {
        // If the browser pauses at end without firing loop, restart
        const video = e.currentTarget
        if (video.currentTime >= video.duration - 0.1 && video.duration > 0) {
          restartVideo()
        }
      }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support embedded video playback.
    </video>
  )
}
