'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { celebrations } from '@/lib/delight-animations';

interface SuccessToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  celebration?: boolean;
}

export default function SuccessToast({
  message,
  show,
  onClose,
  duration = 4000,
  celebration = true,
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Trigger celebration
      if (celebration) {
        setTimeout(() => {
          const toast = document.getElementById('success-toast');
          if (toast) {
            celebrations.success(toast);
          }
        }, 100);
      }

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose, celebration]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 animate-fade-up ${!isVisible ? 'opacity-0' : ''}`}>
      <div
        id="success-toast"
        className="flex items-center gap-3 bg-white border-2 border-success-green rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md"
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-success-green/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success-green" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
