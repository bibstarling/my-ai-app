'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  Sparkles,
  Briefcase,
  FileText,
  Mail,
  Search,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  features?: string[];
};

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👏 Welcome to Applause!',
    description: 'Your AI-powered career platform that makes job searching feel like a celebration. Let\'s take a quick tour of what you can do!',
    icon: <Sparkles className="w-12 h-12 text-[#e07a5f]" />,
    features: [
      'Build stunning portfolios with AI',
      'Create tailored resumes in seconds',
      'Generate compelling cover letters',
      'Find and track job opportunities',
      'Get career coaching from AI',
    ],
  },
  {
    id: 'portfolio',
    title: '🎨 Build Your Portfolio',
    description: 'Chat with AI to create your professional portfolio website. Upload files, paste URLs, or just tell AI about your work!',
    icon: <Briefcase className="w-12 h-12 text-[#e07a5f]" />,
    action: {
      label: 'Start Building Portfolio',
      href: '/portfolio/builder',
    },
    features: [
      'Natural conversation with AI',
      'Upload resumes & certificates',
      'Scrape LinkedIn & GitHub',
      'Live preview as you build',
      'Custom URL for your portfolio',
    ],
  },
  {
    id: 'resume',
    title: '📄 Smart Resume Builder',
    description: 'Generate job-specific resumes automatically from your portfolio. AI picks the most relevant experience for each job!',
    icon: <FileText className="w-12 h-12 text-[#3b82f6]" />,
    action: {
      label: 'Create Your First Resume',
      href: '/resume-builder',
    },
    features: [
      'Portfolio-powered generation',
      'AI content selection',
      'Job-specific optimization',
      'Multiple versions',
      'ATS-friendly export',
    ],
  },
  {
    id: 'cover-letter',
    title: '✉️ Cover Letter Generator',
    description: 'Generate compelling, job-specific cover letters that highlight your most relevant achievements.',
    icon: <Mail className="w-12 h-12 text-[#10b981]" />,
    action: {
      label: 'Write a Cover Letter',
      href: '/cover-letters',
    },
    features: [
      'AI-powered writing',
      'Smart content selection',
      'Professional structure',
      'Full customization',
      'Export to PDF',
    ],
  },
  {
    id: 'jobs',
    title: '🔍 Find Your Dream Job',
    description: 'Search jobs from multiple sources, get match scores, and track your applications all in one place.',
    icon: <Search className="w-12 h-12 text-[#3b82f6]" />,
    action: {
      label: 'Start Job Search',
      href: '/assistant/job-search',
    },
    features: [
      'Multi-source aggregation',
      'Skills-based matching',
      'Match scoring & analysis',
      'Application tracking',
      'Remote job filtering',
    ],
  },
  {
    id: 'ai-coach',
    title: '🤖 Your AI Career Coach',
    description: 'Get personalized career advice, interview prep, and job search help whenever you need it.',
    icon: <MessageSquare className="w-12 h-12 text-[#e07a5f]" />,
    action: {
      label: 'Chat with AI Coach',
      href: '/assistant/chat',
    },
    features: [
      'Career coaching',
      'Interview preparation',
      'Resume feedback',
      'Job search strategies',
      'Available 24/7',
    ],
  },
];

type OnboardingTourProps = {
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
};

export function OnboardingTour({ isOpen, onClose, autoStart = false }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (isOpen && autoStart) {
      setCurrentStep(0);
    }
  }, [isOpen, autoStart]);

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

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = async () => {
    setIsClosing(true);
    
    // Mark onboarding as completed
    try {
      await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      });
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
    }
    
    onClose();
    setIsClosing(false);
  };

  const handleActionClick = () => {
    if (step.action) {
      handleClose();
      router.push(step.action.href);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleSkip}>
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
                    onClick={handleSkip}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                    disabled={isClosing}
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
                      Step {currentStep + 1} of {steps.length}
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
                  {step.features && (
                    <div className="space-y-3 mb-6">
                      {step.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-all hover:bg-gray-100"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action button */}
                  {step.action && (
                    <div className="mb-6">
                      <button
                        onClick={handleActionClick}
                        className="w-full py-3 px-6 bg-gradient-to-r from-[#e07a5f] to-[#3b82f6] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        disabled={isClosing}
                      >
                        {step.action.label}
                      </button>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={handlePrevious}
                      disabled={isFirstStep || isClosing}
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
                          disabled={isClosing}
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
                      disabled={isClosing}
                      className="flex items-center gap-2 px-4 py-2 bg-[#e07a5f] text-white font-medium rounded-lg hover:bg-[#d16a4f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{isLastStep ? 'Get Started' : 'Next'}</span>
                      {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Skip button */}
                  {!isLastStep && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleSkip}
                        disabled={isClosing}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
                      >
                        Skip tour
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
