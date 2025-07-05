'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdsenseProps {
  adSlot: string;
}

/**
 * Handles the logic for a single Google AdSense unit.
 * Uses useEffect to safely run the AdSense script after the component mounts
 * and re-runs it on route changes to support single-page application navigation.
 * 
 * @param {object} props - The component props.
 * @param {string} props.adSlot - The Google AdSense ad slot ID from your AdSense account.
 * @returns {JSX.Element} The <ins> tag that AdSense uses to inject the ad.
 */
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const Adsense = ({ adSlot }: AdsenseProps) => {
  const router = useRouter();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [router.asPath]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT} // Your AdSense publisher ID
      data-ad-slot={adSlot} // The specific ad unit slot ID
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
};

export default Adsense;
