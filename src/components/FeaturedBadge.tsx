import React from 'react';

interface FeaturedBadgeProps {
  text?: string;
  className?: string;
}

const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({ text = 'Featured', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
        bg-amber-600 text-white shadow-md font-serif ${className}`}
    >
      {text}
    </span>
  );
};

export default FeaturedBadge;
