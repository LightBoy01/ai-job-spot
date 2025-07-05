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
    <div className="
      w-full                 
      min-h-[280px]          
      p-4                    
      border-2               
      border-dashed          
      border-gray-300 
      bg-gray-50             
      flex                   
      items-center           
      justify-center         
      text-center
      my-4                   // Added margin for spacing between multiple ad units
    ">
      {isProduction ? (
        <Adsense adSlot={slot} />
      ) : (
        <span className="text-gray-400 text-sm">Ad Placeholder (Dev Mode)</span>
      )}
    </div>
  );
};

export default AdContainer;
