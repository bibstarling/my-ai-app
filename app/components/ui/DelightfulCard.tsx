'use client';

import { ReactNode, useRef } from 'react';
import { shimmer, createRipple } from '@/lib/delight-animations';

interface DelightfulCardProps {
  children: ReactNode;
  onClick?: () => void;
  shimmerOnHover?: boolean;
  rippleOnClick?: boolean;
  className?: string;
  hoverLift?: boolean;
}

export default function DelightfulCard({
  children,
  onClick,
  shimmerOnHover = true,
  rippleOnClick = true,
  className = '',
  hoverLift = true,
}: DelightfulCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasHovered = useRef(false);

  const handleMouseEnter = () => {
    if (shimmerOnHover && cardRef.current && !hasHovered.current) {
      shimmer(cardRef.current);
      hasHovered.current = true;
      
      // Reset after animation completes
      setTimeout(() => {
        hasHovered.current = false;
      }, 1000);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rippleOnClick && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      createRipple(cardRef.current, e.clientX, e.clientY);
    }

    if (onClick) {
      onClick();
    }
  };

  const baseStyles = 'rounded-xl border-2 border-border bg-white shadow-md transition-all duration-300';
  const interactiveStyles = onClick ? 'cursor-pointer' : '';
  const hoverStyles = hoverLift ? 'hover-lift' : '';

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`${baseStyles} ${interactiveStyles} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
}
