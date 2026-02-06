'use client';

import { useEffect, useRef } from 'react';
import { countUp } from '@/lib/delight-animations';

interface CountUpNumberProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export default function CountUpNumber({
  from = 0,
  to,
  duration = 1000,
  suffix = '',
  className = '',
}: CountUpNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (elementRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      countUp(elementRef.current, from, to, duration, suffix);
    }
  }, [from, to, duration, suffix]);

  return (
    <span ref={elementRef} className={className}>
      {from}{suffix}
    </span>
  );
}
