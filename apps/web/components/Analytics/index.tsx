import { useEffect } from "react";

const BEACON_ENDPOINT = "https://beacon.nicholasgriffin.dev";
const BEACON_CDN_ENDPOINT = "https://beacon-cdn.nicholasgriffin.dev";
const SHOULD_TRACK_CLICKS = true;
const SHOULD_TRACK_USER_TIMINGS = true;
const RESPECT_DO_NOT_TRACK = false;

declare global {
  interface Window {
    Beacon?: {
      version: string;
      config: Record<string, string>;
      init: (config: {
        endpoint: string;
        cdnEndpoint?: string;
        siteId: string;
        debug: boolean;
        trackClicks: boolean;
        trackUserTimings: boolean;
        respectDoNotTrack: boolean;
        directEvents?: boolean;
        directPageViews?: boolean;
        batchSize?: number;
        batchTimeout?: number;
      }) => void;
      trackEvent: (event: {
        name: string;
        category: string;
        label?: string;
        value?: number | string;
        non_interaction?: boolean;
        properties?: Record<string, string>;
      }) => void;
      trackPageView: (pageView: {
        content_type?: string;
        virtual_pageview?: boolean;
        properties?: Record<string, string>;
      }) => void;
      setConsent: (consent: boolean) => void;
      hasConsent: () => boolean;
      getUserId: () => string;
    };
    _beaconInitialized?: boolean;
    _openFeatureInitialized?: boolean;
    BeaconOpenFeature?: {
      init: (config: {
        endpoint: string;
        cdnEndpoint?: string;
        siteId?: string;
        debug: boolean;
      }) => Promise<unknown>;
      getObjectDetails: (
        flagKey: string,
        defaultValue: Record<string, string>,
        context?: Record<string, unknown>,
      ) => Promise<{
        flagKey: string;
        value: Record<string, string>;
        variant?: string;
        reason?: string;
        errorCode?: string;
        errorMessage?: string;
        flagMetadata: Record<string, string | number | boolean>;
      }>;
      track: (
        trackingEventName: string,
        context?: Record<string, unknown>,
        details?: Record<string, unknown>,
      ) => void;
    };
    OpenFeature?: Window["BeaconOpenFeature"];
  }
}

export function Analytics({
  isEnabled = true,
  beaconEndpoint = BEACON_ENDPOINT,
  beaconCdnEndpoint = BEACON_CDN_ENDPOINT,
  beaconSiteId = "test-beacon",
  beaconDebug = false,
  directEvents = false,
  directPageViews = true,
  batchSize = 10,
  batchTimeout = 5000,
}: {
  isEnabled?: boolean;
  beaconEndpoint?: string;
  beaconCdnEndpoint?: string;
  beaconSiteId?: string;
  beaconDebug?: boolean;
  directEvents?: boolean;
  directPageViews?: boolean;
  batchSize?: number;
  batchTimeout?: number;
}) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to enabled state
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (
      window._beaconInitialized ||
      document.querySelector(`script[src="${beaconEndpoint}/beacon.min.js"]`)
    ) {
      return;
    }

    window._beaconInitialized = true;

    const script = document.createElement("script");
    script.src = `${beaconEndpoint}/beacon.min.js`;
    script.async = true;

    script.onload = () => {
      if (window.Beacon) {
        window.Beacon.init({
          endpoint: beaconEndpoint,
          cdnEndpoint: beaconCdnEndpoint,
          siteId: beaconSiteId,
          debug: beaconDebug,
          trackClicks: SHOULD_TRACK_CLICKS,
          trackUserTimings: SHOULD_TRACK_USER_TIMINGS,
          respectDoNotTrack: RESPECT_DO_NOT_TRACK,
          directEvents,
          directPageViews,
          batchSize,
          batchTimeout,
        });
      }
    };

    document.head.appendChild(script);

    return () => {};
  }, [isEnabled]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to enabled state
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (
      window._openFeatureInitialized ||
      document.querySelector(`script[src="${beaconEndpoint}/exp-beacon.min.js"]`)
    ) {
      return;
    }

    window._openFeatureInitialized = true;

    const script = document.createElement("script");
    script.src = `${beaconEndpoint}/exp-beacon.min.js`;
    script.async = true;

    script.onload = () => {
      if (window.BeaconOpenFeature) {
        window.BeaconOpenFeature.init({
          debug: beaconDebug,
          endpoint: beaconEndpoint,
          cdnEndpoint: beaconCdnEndpoint,
          siteId: beaconSiteId,
        });
      }
    };

    document.head.appendChild(script);

    return () => {};
  }, [isEnabled]);

  return null;
}
