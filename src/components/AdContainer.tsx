'use client';

import Adsense from './Adsense';

interface AdContainerProps {
  slot: string;
}

/**
 * A flexible container for displaying Google AdSense ads.
 * It provides a stable, styled placeholder and conditionally renders the
 * actual ad component only in the production environment.
 *
 * @param {object} props - The component props.
 * @param {string} props.slot - The Google AdSense ad slot ID.
 * @returns {JSX.Element} The rendered AdContainer component.
 */
const AdContainer = ({ slot }: AdContainerProps) => {
  // Ads should only be loaded in the production environment
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className="ad-container">
      <div className="text-center text-xs text-neutral-400 font-serif tracking-widest uppercase mb-2">
        Advertisement
      </div>
      {isProduction ? (
        <Adsense
          key={slot}
          adSlot={slot}
          dataAdFormat="auto"
          dataFullWidthResponsive={true}
        />
      ) : (
        <div className="w-full h-60 bg-neutral-100 flex items-center justify-center rounded-md">
          <span className="text-neutral-400 text-sm">Ad Placeholder (Dev Mode)</span>
        </div>
      )}
    </div>
  );
};

export default AdContainer;
