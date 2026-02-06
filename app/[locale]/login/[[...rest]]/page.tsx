'use client';

import { SignIn } from '@clerk/nextjs';
import { CheckCircle, Sparkles, Briefcase, FileText, Bot, Zap, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import FloatingElements from '@/app/components/ui/FloatingElements';
import Image from 'next/image';

export default function LoginPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  const features = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI Portfolio Builder',
      description: 'Show off your amazing work by chatting with AI. Upload resumes, add projects, and watch your portfolio come to life! ✨',
      color: 'bg-applause-purple',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Smart Resume Generator',
      description: 'Create resumes that deserve a standing ovation! AI picks your best experiences and tailors them for each job. 🎯',
      color: 'bg-celebration-pink',
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: 'AI Cover Letters',
      description: 'Write cover letters that make hiring managers smile! AI crafts compelling stories about your achievements. 💌',
      color: 'bg-success-green',
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      title: 'Job Matching',
      description: 'Find your dream role faster! Get matched with jobs you\'ll love and see exactly how you stack up. 🚀',
      color: 'bg-ocean-blue',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Career Assistant',
      description: 'Your personal cheerleader for career success! Get coaching, interview prep, and job search guidance. 💪',
      color: 'bg-sunshine-yellow',
    },
  ];

  const benefits = [
    'Save hours and celebrate more wins! 🎉',
    'Stand out with AI-optimized applications',
    'Track every application in one place',
    'Get your own stunning portfolio URL',
    'Free to start, no credit card needed',
  ];

  return (
    <div className="min-h-screen gradient-primary relative overflow-hidden">
      {/* Floating celebration elements */}
      <FloatingElements density="medium" />
      
      {/* Celebration pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(/graphics/celebration-pattern.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Left Side - Value Proposition */}
          <div className="space-y-8 lg:pt-12 animate-fade-up">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 animate-bounce-in">
                <Image 
                  src="/graphics/star-burst.svg" 
                  alt="" 
                  width={20} 
                  height={20}
                  className="animate-pulse-subtle"
                />
                <span className="text-sm font-semibold text-white">AI-Powered Career Platform</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                Your Career Deserves Applause! 👏
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow">
                Turn job searching into a celebration! Build stunning portfolios, create standout resumes, 
                and find your dream role—all with AI as your cheerleader. 🎉
              </p>
            </div>

            {/* Quick Benefits */}
            <div 
              className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-white/50 p-6 shadow-2xl hover-lift animate-fade-up animate-delay-100"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-applause-purple mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 fill-current" />
                Why People Love Applause
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
                    <CheckCircle className="h-5 w-5 text-success-green shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Grid */}
            <div className="space-y-4 animate-fade-up animate-delay-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Celebrate These Features
              </h3>
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="bg-white/95 backdrop-blur-md rounded-xl border-2 border-white/50 p-5 hover:border-white hover:shadow-2xl transition-all group hover-lift animate-fade-up"
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${feature.color} rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border-2 border-white/50 p-6 shadow-xl hover-lift animate-fade-up animate-delay-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full gradient-primary border-2 border-white shadow-lg" />
                  <div className="w-10 h-10 rounded-full gradient-success border-2 border-white shadow-lg" />
                  <div className="w-10 h-10 rounded-full gradient-warm border-2 border-white shadow-lg" />
                </div>
                <div className="text-sm font-bold text-foreground">
                  Join people already celebrating their career wins! 🎊
                </div>
              </div>
              <p className="text-xs text-muted flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-success-green" />
                Free to start. No credit card. Just pure celebration!
              </p>
            </div>

            {/* Hero Illustration */}
            <div className="hidden lg:block animate-fade-up animate-delay-400">
              <Image 
                src="/graphics/hero-illustration.svg" 
                alt="Career celebration" 
                width={500} 
                height={400}
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="lg:sticky lg:top-12 animate-fade-up animate-delay-200">
            <div className="bg-white rounded-3xl border-4 border-white/80 shadow-2xl p-8 backdrop-blur-md hover-lift relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 opacity-20 pointer-events-none">
                <Image 
                  src="/graphics/confetti.svg" 
                  alt="" 
                  width={96} 
                  height={96}
                />
              </div>
              
              <div className="mb-8 text-center relative">
                <div className="inline-block mb-3">
                  <Image 
                    src="/graphics/applause-hands.svg" 
                    alt="" 
                    width={60} 
                    height={60}
                    className="animate-pulse-subtle"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gradient-primary mb-2">
                  Start Your Applause Journey! 🎉
                </h2>
                <p className="text-sm text-muted">
                  Create your account and celebrate your career wins
                </p>
              </div>
              
              <div className="flex justify-center">
                <SignIn
                  appearance={{
                    elements: {
                      formButtonPrimary: 
                        'gradient-primary hover:opacity-90 text-white transition-all hover:scale-105',
                      card: 'shadow-none',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'border-border hover:bg-muted/50 transition-all hover:scale-105',
                      formFieldInput:
                        'border-border focus:border-applause-purple focus:ring-applause-purple transition-all',
                      footerActionLink:
                        'text-applause-purple hover:text-celebration-pink transition-colors font-semibold',
                      identityPreviewText: 'text-foreground font-medium',
                      identityPreviewEditButton: 'text-applause-purple hover:text-celebration-pink',
                    },
                  }}
                  routing="path"
                  path="/login"
                  signUpUrl="/login"
                  forceRedirectUrl="/dashboard"
                  fallbackRedirectUrl="/dashboard"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-border/50">
                <p className="text-xs text-center text-muted">
                  By continuing, you agree to celebrate your career wins with us! 🎊<br/>
                  <span className="text-[10px]">Also, our Terms of Service and Privacy Policy</span>
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs animate-fade-up animate-delay-300">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full border border-white/50 shadow-lg">
                <CheckCircle className="h-4 w-4 text-success-green" />
                <span className="font-semibold text-foreground">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full border border-white/50 shadow-lg">
                <CheckCircle className="h-4 w-4 text-success-green" />
                <span className="font-semibold text-foreground">Free to Start</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full border border-white/50 shadow-lg">
                <CheckCircle className="h-4 w-4 text-success-green" />
                <span className="font-semibold text-foreground">No Credit Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
