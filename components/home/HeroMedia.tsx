"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const desktopMedia = "(min-width: 769px)";

export function HeroMedia() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMedia);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreferences = () => {
      setIsDesktop(mediaQuery.matches);
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    updatePreferences();
    mediaQuery.addEventListener("change", updatePreferences);
    reducedMotionQuery.addEventListener("change", updatePreferences);
    return () => {
      mediaQuery.removeEventListener("change", updatePreferences);
      reducedMotionQuery.removeEventListener("change", updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || prefersReducedMotion || videoFailed) return;

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isDesktop, prefersReducedMotion, videoFailed]);

  return (
    <div className="hero-video-wrap">
      <Image
        className="hero-poster"
        src={isDesktop ? "/images/yarn_hero_800.jpg" : "/images/hero_mobile_optimized_768.jpg"}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
      />
      {isDesktop && !prefersReducedMotion && !videoFailed ? (
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/yarn_hero_800.jpg"
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
        >
          <source src="/images/hero_video.mp4" type="video/mp4" />
        </video>
      ) : null}
      <div className="hero-overlay" />
    </div>
  );
}
