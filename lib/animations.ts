/**
 * Animation utilities for Applause brand celebrations
 */

/**
 * Creates a confetti burst effect at a specific position
 */
export function createConfettiBurst(
  x: number,
  y: number,
  options: {
    count?: number;
    colors?: string[];
    spread?: number;
    duration?: number;
  } = {}
) {
  const {
    count = 30,
    colors = ['#8b5cf6', '#ec4899', '#10b981', '#fbbf24', '#3b82f6', '#fb7185', '#6ee7b7'],
    spread = 100,
    duration = 2000,
  } = options;

  const confettiPieces: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 8;
    
    // Random shape
    const shapes = ['circle', 'square', 'rectangle'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    confetti.style.position = 'fixed';
    confetti.style.left = `${x}px`;
    confetti.style.top = `${y}px`;
    confetti.style.width = shape === 'rectangle' ? `${size * 1.5}px` : `${size}px`;
    confetti.style.height = shape === 'rectangle' ? `${size / 2}px` : `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = shape === 'circle' ? '50%' : '2px';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    
    document.body.appendChild(confetti);
    confettiPieces.push(confetti);

    // Physics
    const angle = (Math.random() * Math.PI * 2);
    const velocity = spread / 2 + Math.random() * spread;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 150; // Initial upward velocity

    let posX = 0;
    let posY = 0;
    let velY = vy;
    let rotation = 0;
    let opacity = 1;
    const gravity = 5;
    const rotationSpeed = (Math.random() - 0.5) * 20;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        confetti.remove();
        return;
      }

      posX += vx * 0.1;
      posY += velY * 0.1;
      velY += gravity;
      rotation += rotationSpeed;
      opacity = 1 - progress;

      confetti.style.transform = `translate(${posX}px, ${posY}px) rotate(${rotation}deg)`;
      confetti.style.opacity = `${opacity}`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Cleanup after animation
  setTimeout(() => {
    confettiPieces.forEach(piece => piece.remove());
  }, duration + 100);
}

/**
 * Trigger celebration confetti on an element
 */
export function celebrate(element: HTMLElement, options?: Parameters<typeof createConfettiBurst>[2]) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  createConfettiBurst(x, y, options);
}

/**
 * Animation presets for common use cases
 */
export const animationPresets = {
  /**
   * Gentle fade up animation
   */
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },

  /**
   * Bounce in animation
   */
  bounceIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  /**
   * Scale up animation
   */
  scaleUp: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  /**
   * Slide in from right
   */
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  /**
   * Celebration burst (for success states)
   */
  celebrate: {
    initial: { scale: 0.8 },
    animate: { scale: [0.8, 1.1, 1] },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * Stagger animation children by a delay
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0.01 : defaultDuration;
}
