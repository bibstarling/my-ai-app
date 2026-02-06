'use client';

import { SignIn } from '@clerk/nextjs';
import { CheckCircle, Sparkles, Briefcase, FileText, Bot, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [showClerkError, setShowClerkError] = useState(false);

  // Show error if Clerk doesn't load within 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowClerkError(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  const features = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI Portfolio Builder',
      description: 'Build your professional portfolio by chatting with AI. Upload resumes, scrape URLs, and let AI structure your content beautifully.',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Smart Resume Generator',
      description: 'Generate job-specific resumes automatically from your portfolio. AI picks relevant experience and tailors content to each job.',
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: 'AI Cover Letters',
      description: 'Create compelling, personalized cover letters in seconds. AI analyzes job descriptions and highlights your best achievements.',
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      title: 'Job Matching',
      description: 'Find jobs that match your skills across multiple sources. Get compatibility scores and gap analysis for each position.',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Career Assistant',
      description: 'Get personalized career coaching, interview prep, and job search guidance powered by AI.',
    },
  ];

  const benefits = [
    'Save hours on resume customization',
    'Stand out with AI-optimized applications',
    'Track all your job applications in one place',
    'Get your own professional portfolio URL',
    'Access powerful career tools for free',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Left Side - Value Proposition */}
          <div className="space-y-8 lg:pt-12">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">AI-Powered Career Platform</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Your AI Career Assistant
              </h1>
              <p className="text-lg text-muted leading-relaxed">
                Build your portfolio, generate tailored resumes and cover letters, find matching jobs, 
                and accelerate your career—all powered by AI.
              </p>
            </div>

            {/* Quick Benefits */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-4">
                Why Professionals Choose Us
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
                Powerful Features
              </h3>
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-lg border border-border p-5 hover:border-accent transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-accent/10 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-gradient-to-br from-accent/5 to-transparent rounded-xl border border-accent/20 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-accent/30 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-accent/40 border-2 border-white" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  Join professionals already using AI to advance their careers
                </div>
              </div>
              <p className="text-xs text-muted">
                Free to start. No credit card required.
              </p>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="lg:sticky lg:top-12">
            <div className="bg-white rounded-2xl border border-border shadow-xl p-8">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Get Started
                </h2>
                <p className="text-sm text-muted">
                  Create your account or sign in to continue
                </p>
              </div>
              
              <div className="flex justify-center w-full">
                {!isLoaded && !showClerkError ? (
                  <div className="w-full text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm text-muted">Loading sign in...</p>
                  </div>
                ) : showClerkError ? (
                  <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 mb-2 font-semibold">Authentication Service Error</div>
                    <p className="text-sm text-red-800 mb-4">
                      Unable to load the sign-in form. This may be due to a domain configuration issue.
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <SignIn
                    appearance={{
                      elements: {
                        formButtonPrimary: 
                          'bg-accent hover:bg-accent/90 text-white',
                        card: 'shadow-none w-full',
                        rootBox: 'w-full',
                        headerTitle: 'hidden',
                        headerSubtitle: 'hidden',
                        socialButtonsBlockButton:
                          'border-border hover:bg-muted/50 transition-colors',
                        socialButtonsBlockButtonText:
                          'font-medium',
                        formFieldInput:
                          'border-border focus:border-accent focus:ring-accent',
                        footerActionLink:
                          'text-accent hover:text-accent/80 font-medium',
                        identityPreviewText: 'font-medium',
                        formFieldLabel: 'font-medium',
                        otpCodeFieldInput:
                          'border-border focus:border-accent',
                        formResendCodeLink:
                          'text-accent hover:text-accent/80',
                        footer: 'hidden',
                      },
                      layout: {
                        socialButtonsPlacement: 'top',
                        socialButtonsVariant: 'blockButton',
                      },
                    }}
                    routing="path"
                    path="/login"
                    signUpUrl="/login"
                    forceRedirectUrl="/dashboard"
                    fallbackRedirectUrl="/dashboard"
                    signUpForceRedirectUrl="/dashboard"
                    signUpFallbackRedirectUrl="/dashboard"
                  />
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="space-y-3">
                  <p className="text-xs text-center text-muted">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                    <p className="text-xs text-center text-muted-foreground">
                      💡 <strong>New here?</strong> Click "Don't have an account? Sign up" below the form to create your account with email.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>Free to Start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span>No Credit Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
