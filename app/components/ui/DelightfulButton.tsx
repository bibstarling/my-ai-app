'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { bounceElement, createSparkles, celebrations } from '@/lib/delight-animations';

interface DelightfulButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  celebration?: 'sparkles' | 'applause' | 'success' | 'complete' | 'like' | 'none';
  icon?: ReactNode;
}

export default function DelightfulButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  celebration = 'sparkles',
  icon,
  className = '',
  onClick,
  disabled,
  ...props
}: DelightfulButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const button = e.currentTarget;
    
    // Bounce animation
    bounceElement(button);

    // Celebration effect if specified
    if (celebration !== 'none') {
      switch (celebration) {
        case 'sparkles':
          createSparkles(button, { count: 8 });
          break;
        case 'applause':
          celebrations.applause(button);
          break;
        case 'success':
          celebrations.success(button);
          break;
        case 'complete':
          celebrations.complete(button);
          break;
        case 'like':
          celebrations.like(button);
          break;
      }
    }

    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = 'relative overflow-hidden font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 hover-scale';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-accent text-white hover:opacity-90 shadow-lg hover:shadow-xl',
    secondary: 'bg-secondary text-white hover:opacity-90 shadow-lg hover:shadow-xl',
    success: 'bg-success-green text-white hover:opacity-90 shadow-lg hover:shadow-xl',
    gradient: 'gradient-primary text-white hover:opacity-90 shadow-xl hover:shadow-2xl',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled || loading ? disabledStyles : ''}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {icon && !loading && icon}
      {children}
    </button>
  );
}
