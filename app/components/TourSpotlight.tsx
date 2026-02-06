'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

type TourSpotlightProps = {
  targetSelector: string | null;
  title: string;
  description: string;
  icon?: React.ReactNode;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  showNext?: boolean;
  showPrevious?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

export function TourSpotlight({
  targetSelector,
  title,
  description,
  icon,
  step,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  showNext = true,
  showPrevious = true,
  position = 'bottom',
}: TourSpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightBox, setHighlightBox] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setTargetElement(null);
      elementRef.current = null;
      return;
    }

    let retryCount = 0;
    const maxRetries = 50;

    // Find the target element
    const findElement = () => {
      const element = document.querySelector(targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        elementRef.current = element;
        
        // Add subtle highlight to element
        element.style.backgroundColor = 'rgba(224, 122, 95, 0.1)';
        element.style.transition = 'background-color 0.3s ease';
        
        updatePositions(element);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (retryCount < maxRetries) {
        // Retry after a short delay if element not found
        retryCount++;
        setTimeout(findElement, 100);
      }
    };

    findElement();

    // Update positions on resize and scroll
    const handleUpdate = () => {
      if (elementRef.current) {
        updatePositions(elementRef.current);
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      
      // Clean up style changes
      if (elementRef.current) {
        elementRef.current.style.backgroundColor = '';
        elementRef.current.style.transition = '';
      }
    };
  }, [targetSelector]);

  const updatePositions = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const padding = 8;

    // Update highlight box
    setHighlightBox({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position
    const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - 20;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 20;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 20;
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Keep tooltip within viewport
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = window.innerWidth - tooltipWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }

    setTooltipPosition({ top, left });
  };

  return (
    <>
      {/* Subtle backdrop for center modals only */}
      {!targetElement && (
        <div className="fixed inset-0 bg-black/40 z-[9999]" onClick={onSkip} />
      )}

      <div
        ref={tooltipRef}
        className="fixed bg-white rounded-xl shadow-2xl border-2 border-[#e07a5f] p-6 max-w-md transition-all duration-300 z-[99999]"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step} of {totalSteps}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i + 1 === step ? 'bg-[#e07a5f] w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e07a5f] to-[#3b82f6] transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Icon and Content */}
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="flex-1 pr-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onPrevious}
            disabled={!showPrevious}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>

          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip tour
          </button>

          <button
            onClick={onNext}
            disabled={!showNext}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#e07a5f] to-[#3b82f6] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{step === totalSteps ? 'Finish' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
