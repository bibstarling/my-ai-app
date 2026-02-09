'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

type HelpButtonProps = {
  onClick: () => void;
  tooltip?: string;
  position?: 'fixed' | 'absolute';
  className?: string;
};

export function HelpButton({ 
  onClick, 
  tooltip = "Take a guided tour of this page",
  position = 'fixed',
  className = ''
}: HelpButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = position === 'fixed' 
    ? 'fixed top-24 right-6 z-40' 
    : 'absolute';

  return (
    <div className={`${positionClasses} ${className}`}>
      <div className="relative">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-xs">
              {tooltip}
              <div className="absolute bottom-full right-6 -mb-1">
                <div className="border-8 border-transparent border-b-gray-900" />
              </div>
            </div>
          </div>
        )}

        {/* Help Button */}
        <button
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="group relative w-14 h-14 bg-gradient-to-br from-[#e07a5f] to-[#3b82f6] rounded-full shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
          aria-label="Page tour"
        >
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e07a5f] to-[#3b82f6] animate-ping opacity-20" />
          
          {/* Icon */}
          <HelpCircle className="w-7 h-7 text-white relative z-10" />
          
          {/* Shine effect on hover */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}
