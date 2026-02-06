'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

export type TourStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
  image?: string;
};

type PageTourProps = {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  title: string;
};

export function PageTour({ isOpen, onClose, steps, title }: PageTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#e07a5f] to-[#3b82f6] p-6">
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-white/90 text-sm font-medium">
                      {title} - Step {currentStep + 1} of {steps.length}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      {step.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <Dialog.Title className="text-3xl font-bold text-white text-center mb-2">
                    {step.title}
                  </Dialog.Title>

                  {/* Description */}
                  <p className="text-white/90 text-center text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Image if provided */}
                  {step.image && (
                    <div className="mb-6 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img 
                        src={step.image} 
                        alt={step.title}
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Tips */}
                  {step.tips && step.tips.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {step.tips.map((tip, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-all hover:bg-gray-100"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={handlePrevious}
                      disabled={isFirstStep}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="font-medium">Previous</span>
                    </button>

                    <div className="flex gap-2">
                      {steps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentStep
                              ? 'bg-[#e07a5f] w-6'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Go to step ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-4 py-2 bg-[#e07a5f] text-white font-medium rounded-lg hover:bg-[#d16a4f] transition-colors"
                    >
                      <span>{isLastStep ? 'Got it!' : 'Next'}</span>
                      {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Close button */}
                  {!isLastStep && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleClose}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Close tour
                      </button>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
