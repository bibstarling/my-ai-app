'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CelebrationButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  confetti?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function CelebrationButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  confetti = true,
  className = '',
  type = 'button',
}: CelebrationButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Trigger click animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    // Show confetti effect if enabled
    if (confetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
      createConfetti(e.currentTarget);
    }

    if (onClick) {
      await onClick();
    }
  };

  const createConfetti = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create confetti pieces
    for (let i = 0; i < 15; i++) {
      const confetti = document.createElement('div');
      const colors = ['#e07a5f', '#d4663f', '#475569', '#10b981', '#3b82f6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.position = 'fixed';
      confetti.style.left = `${centerX}px`;
      confetti.style.top = `${centerY}px`;
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = color;
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      
      document.body.appendChild(confetti);

      // Animate confetti
      const angle = (Math.PI * 2 * i) / 15;
      const velocity = 50 + Math.random() * 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 100;

      let x = 0;
      let y = 0;
      let opacity = 1;
      const gravity = 3;
      let vy_current = vy;

      const animate = () => {
        x += vx * 0.1;
        y += vy_current * 0.1;
        vy_current += gravity;
        opacity -= 0.02;

        confetti.style.transform = `translate(${x}px, ${y}px) rotate(${x * 2}deg)`;
        confetti.style.opacity = `${opacity}`;

        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          confetti.remove();
        }
      };

      requestAnimationFrame(animate);
    }
  };

  // Base styles
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-accent text-accent-foreground hover:opacity-90 active:scale-95',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90 active:scale-95',
    success: 'bg-success text-success-foreground hover:opacity-90 active:scale-95',
    gradient: 'gradient-primary text-white hover:opacity-90 active:scale-95',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';
  const clickedStyles = isClicked ? 'scale-95' : '';

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled || loading ? disabledStyles : ''}
        ${clickedStyles}
        ${className}
      `}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
