"use client";

import { useEffect } from "react";
import { getTrackedElementPayload, trackSiteEvent } from "@/lib/siteTracking";

export function DataTrackBridge() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trackedElement = target.closest<HTMLElement>("[data-track]");
      if (!trackedElement || trackedElement.dataset.trackHandled === "true") return;

      const trackKey = trackedElement.dataset.track;
      if (!trackKey) return;

      trackSiteEvent(trackKey, getTrackedElementPayload(trackedElement));
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
