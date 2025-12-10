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
    <div className="w-full flex flex-col items-center my-8">
      <div className="text-[10px] text-neutral-400 font-serif tracking-widest uppercase mb-2 opacity-60">
        Advertisement
      </div>
      {isProduction ? (
        <div className="min-h-[250px] w-full flex justify-center bg-transparent">
          <Adsense
            key={slot}
            adSlot={slot}
            dataAdFormat="auto"
            dataFullWidthResponsive={true}
          />
        </div>
      ) : (
        <div className="w-[300px] h-[250px] border border-neutral-200 bg-neutral-50/30 flex items-center justify-center rounded-sm">
          <span className="text-neutral-400 text-xs font-serif italic">Ad Placeholder</span>
        </div>
      )}
    </div>
  );
};

export default AdContainer;
