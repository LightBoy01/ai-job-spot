import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-16 w-auto text-brand-gold">
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        aria-labelledby="logo-title"
      >
        <title id="logo-title">AI Job Spot Logo</title>

        {/* Magnifying glass circle */}
        <circle cx="45" cy="45" r="30" />

        {/* Magnifying glass handle */}
        <line x1="68" y1="68" x2="90" y2="90" strokeLinecap="round" />

        {/* Stylized AI nodes inside the glass */}
        <g strokeWidth="3">
          {/* Nodes */}
          <circle cx="35" cy="35" r="5" fill="currentColor" />
          <circle cx="55" cy="35" r="5" fill="currentColor" />
          <circle cx="45" cy="55" r="5" fill="currentColor" />

          {/* Connections */}
          <line x1="38" y1="39" x2="43" y2="51" />
          <line x1="52" y1="39" x2="47" y2="51" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
