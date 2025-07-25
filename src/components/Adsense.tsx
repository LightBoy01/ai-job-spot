import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Handles the logic for a single Google AdSense unit.
 * Uses useEffect to safely run the AdSense script after the component mounts
 * and re-runs it on route changes to support single-page application navigation.
 * 
 * @param {object} props - The component props.
 * @param {string} props.adSlot - The Google AdSense ad slot ID from your AdSense account.
 * @returns {JSX.Element} The <ins> tag that AdSense uses to inject the ad.
 */
const Adsense = ({ adSlot }) => {
  const router = useRouter();

  useEffect(() => {
    // This effect will run on component mount and every time the route changes.
    // This is crucial for single-page applications like Next.js.
    try {
      // Check if the adsbygoogle script is loaded
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        // Push an ad request to AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [router.asPath]); // The dependency array ensures the ad reloads on page navigation

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
