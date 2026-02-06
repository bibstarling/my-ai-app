'use client';

import { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  left: string;
  delay: number;
  duration: number;
  type: 'confetti' | 'star' | 'circle' | 'square';
  color: string;
  size: number;
}

interface FloatingElementsProps {
  count?: number;
  density?: 'low' | 'medium' | 'high';
}

const colors = ['#e07a5f', '#d4663f', '#475569', '#64748b', '#3b82f6'];

export default function FloatingElements({ count, density = 'medium' }: FloatingElementsProps) {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  // Set count based on density if not provided
  const elementCount = count || (density === 'low' ? 8 : density === 'medium' ? 15 : 25);

  useEffect(() => {
    const newElements: FloatingElement[] = [];
    
    for (let i = 0; i < elementCount; i++) {
      const types: ('confetti' | 'star' | 'circle' | 'square')[] = ['confetti', 'star', 'circle', 'square'];
      
      newElements.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
      });
    }
    
    setElements(newElements);
  }, [elementCount]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute animate-float opacity-30"
          style={{
            left: element.left,
            top: '-20px',
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
          }}
        >
          {element.type === 'circle' && (
            <div
              className="rounded-full"
              style={{
                width: `${element.size}px`,
                height: `${element.size}px`,
                backgroundColor: element.color,
              }}
            />
          )}
          
          {element.type === 'square' && (
            <div
              className="transform rotate-12"
              style={{
                width: `${element.size}px`,
                height: `${element.size}px`,
                backgroundColor: element.color,
              }}
            />
          )}
          
          {element.type === 'star' && (
            <svg
              width={element.size}
              height={element.size}
              viewBox="0 0 20 20"
              fill={element.color}
            >
              <path d="M10 0 L12 7 L19 7 L14 11 L16 19 L10 14 L4 19 L6 11 L1 7 L8 7 Z" />
            </svg>
          )}
          
          {element.type === 'confetti' && (
            <div
              className="transform rotate-45"
              style={{
                width: `${element.size}px`,
                height: `${element.size / 3}px`,
                backgroundColor: element.color,
                borderRadius: '2px',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
