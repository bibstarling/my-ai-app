/**
 * Delightful UX Animations for Applause
 * A collection of micro-interactions and celebration effects
 */

/**
 * Create sparkles that emanate from an element
 */
export function createSparkles(
  element: HTMLElement,
  options: {
    count?: number;
    colors?: string[];
    size?: number;
    duration?: number;
  } = {}
) {
  const {
    count = 12,
    colors = ['#e07a5f', '#d4663f', '#475569', '#10b981'],
    size = 8,
    duration = 1000,
  } = options;

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Create a star shape
    sparkle.innerHTML = '✨';
    sparkle.style.position = 'fixed';
    sparkle.style.left = `${centerX}px`;
    sparkle.style.top = `${centerY}px`;
    sparkle.style.fontSize = `${size + Math.random() * 8}px`;
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '9999';
    sparkle.style.color = color;
    
    document.body.appendChild(sparkle);

    const angle = (Math.PI * 2 * i) / count;
    const distance = 60 + Math.random() * 40;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    let progress = 0;
    const animate = () => {
      progress += 0.02;
      
      if (progress >= 1) {
        sparkle.remove();
        return;
      }

      const x = endX * progress;
      const y = endY * progress - Math.sin(progress * Math.PI) * 20;
      const opacity = 1 - progress;
      const scale = 1 + progress * 0.5;

      sparkle.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${progress * 360}deg)`;
      sparkle.style.opacity = `${opacity}`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

/**
 * Create rising hearts animation
 */
export function createHearts(
  element: HTMLElement,
  options: {
    count?: number;
    duration?: number;
  } = {}
) {
  const { count = 5, duration = 2000 } = options;

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height;

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'fixed';
    heart.style.left = `${centerX + (Math.random() - 0.5) * 60}px`;
    heart.style.top = `${startY}px`;
    heart.style.fontSize = `${16 + Math.random() * 12}px`;
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    
    document.body.appendChild(heart);

    let progress = 0;
    const delay = i * 150;

    const animate = () => {
      if (progress < delay) {
        progress += 16;
        requestAnimationFrame(animate);
        return;
      }

      const actualProgress = (progress - delay) / duration;
      
      if (actualProgress >= 1) {
        heart.remove();
        return;
      }

      const y = -100 * actualProgress;
      const wobble = Math.sin(actualProgress * Math.PI * 4) * 20;
      const opacity = 1 - actualProgress;
      const scale = 1 + Math.sin(actualProgress * Math.PI) * 0.3;

      heart.style.transform = `translate(${wobble}px, ${y}px) scale(${scale})`;
      heart.style.opacity = `${opacity}`;

      progress += 16;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

/**
 * Create a shimmer effect that sweeps across an element
 */
export function shimmer(element: HTMLElement) {
  const originalPosition = element.style.position;
  const originalOverflow = element.style.overflow;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';

  const shimmerEl = document.createElement('div');
  shimmerEl.style.position = 'absolute';
  shimmerEl.style.top = '0';
  shimmerEl.style.left = '-100%';
  shimmerEl.style.width = '100%';
  shimmerEl.style.height = '100%';
  shimmerEl.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)';
  shimmerEl.style.pointerEvents = 'none';
  shimmerEl.style.zIndex = '1';
  
  element.appendChild(shimmerEl);

  shimmerEl.animate(
    [
      { left: '-100%' },
      { left: '100%' }
    ],
    {
      duration: 800,
      easing: 'ease-in-out',
    }
  ).onfinish = () => {
    shimmerEl.remove();
    element.style.position = originalPosition;
    element.style.overflow = originalOverflow;
  };
}

/**
 * Create a bounce effect on element click
 */
export function bounceElement(element: HTMLElement) {
  element.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(0.9)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ],
    {
      duration: 300,
      easing: 'ease-out',
    }
  );
}

/**
 * Create a wiggle animation
 */
export function wiggle(element: HTMLElement) {
  element.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-5deg)' },
      { transform: 'rotate(5deg)' },
      { transform: 'rotate(-5deg)' },
      { transform: 'rotate(5deg)' },
      { transform: 'rotate(0deg)' }
    ],
    {
      duration: 500,
      easing: 'ease-in-out',
    }
  );
}

/**
 * Create floating emoji celebration
 */
export function celebrateWithEmoji(
  element: HTMLElement,
  emoji: string,
  options: {
    count?: number;
    duration?: number;
  } = {}
) {
  const { count = 8, duration = 2000 } = options;

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const emojiEl = document.createElement('div');
    emojiEl.innerHTML = emoji;
    emojiEl.style.position = 'fixed';
    emojiEl.style.left = `${centerX}px`;
    emojiEl.style.top = `${centerY}px`;
    emojiEl.style.fontSize = `${20 + Math.random() * 16}px`;
    emojiEl.style.pointerEvents = 'none';
    emojiEl.style.zIndex = '9999';
    
    document.body.appendChild(emojiEl);

    const angle = (Math.PI * 2 * i) / count;
    const velocity = 80 + Math.random() * 60;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 120;

    let progress = 0;
    let x = 0;
    let y = 0;
    let velY = vy;

    const animate = () => {
      progress += 16;
      
      if (progress >= duration) {
        emojiEl.remove();
        return;
      }

      x += vx * 0.016;
      velY += 4; // gravity
      y += velY * 0.016;

      const opacity = 1 - (progress / duration);
      const rotation = progress * 0.5;

      emojiEl.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      emojiEl.style.opacity = `${opacity}`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

/**
 * Create a ripple effect
 */
export function createRipple(
  element: HTMLElement,
  x: number,
  y: number,
  color: string = 'rgba(139, 92, 246, 0.3)'
) {
  const ripple = document.createElement('div');
  const rect = element.getBoundingClientRect();
  
  ripple.style.position = 'absolute';
  ripple.style.left = `${x - rect.left}px`;
  ripple.style.top = `${y - rect.top}px`;
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = color;
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'translate(-50%, -50%)';
  
  const originalPosition = element.style.position;
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }
  
  element.appendChild(ripple);

  ripple.animate(
    [
      { width: '0', height: '0', opacity: 1 },
      { width: '300px', height: '300px', opacity: 0 }
    ],
    {
      duration: 600,
      easing: 'ease-out',
    }
  ).onfinish = () => {
    ripple.remove();
  };
}

/**
 * Create a success pulse effect
 */
export function successPulse(element: HTMLElement, color: string = '#10b981') {
  const originalBorderColor = element.style.borderColor;
  const originalBoxShadow = element.style.boxShadow;
  
  element.animate(
    [
      { boxShadow: `0 0 0 0 ${color}`, borderColor: color },
      { boxShadow: `0 0 0 10px rgba(16, 185, 129, 0)`, borderColor: originalBorderColor }
    ],
    {
      duration: 600,
      easing: 'ease-out',
    }
  ).onfinish = () => {
    element.style.boxShadow = originalBoxShadow;
  };
}

/**
 * Create a number count-up animation
 */
export function countUp(
  element: HTMLElement,
  from: number,
  to: number,
  duration: number = 1000,
  suffix: string = ''
) {
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(from + (to - from) * easeProgress);
    
    element.textContent = `${current}${suffix}`;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = `${to}${suffix}`;
    }
  };
  
  requestAnimationFrame(animate);
}

/**
 * Create typewriter effect
 */
export function typewriter(
  element: HTMLElement,
  text: string,
  speed: number = 50
) {
  element.textContent = '';
  let index = 0;
  
  const type = () => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  };
  
  type();
}

/**
 * Check if user prefers reduced motion
 */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wrapper to run animation only if motion is allowed
 */
export function animate(fn: () => void) {
  if (shouldAnimate()) {
    fn();
  }
}

/**
 * Celebration presets for common actions
 */
export const celebrations = {
  success: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    createSparkles(element, { colors: ['#10b981', '#6ee7b7', '#fbbf24'] });
    successPulse(element);
  },
  
  complete: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    celebrateWithEmoji(element, '🎉', { count: 6 });
    bounceElement(element);
  },
  
  like: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    createHearts(element, { count: 3 });
  },
  
  publish: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    createSparkles(element, { count: 15 });
    celebrateWithEmoji(element, '🚀', { count: 4 });
  },
  
  milestone: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    celebrateWithEmoji(element, '⭐', { count: 8 });
    shimmer(element);
  },
  
  applause: (element: HTMLElement) => {
    if (!shouldAnimate()) return;
    celebrateWithEmoji(element, '👏', { count: 10 });
    wiggle(element);
  },
};
