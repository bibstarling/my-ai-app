'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Sparkles, 
  FileText, 
  Search, 
  MessageSquare, 
  CheckCircle,
  ArrowRight,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Don't block page render - show content immediately
  // Auth state will update in background
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Applause</span>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link 
                href="/dashboard" 
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login" 
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-accent/5 to-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Your Career Deserves Applause</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Job Search Made <span className="text-gradient-primary">Effortless</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted leading-relaxed mb-8">
              AI-powered platform that helps you build stunning portfolios, create standout resumes, 
              and land your dream job—all with intelligent assistance every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isSignedIn ? (
                <Link 
                  href="/dashboard"
                  className="w-full sm:w-auto rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="w-full sm:w-auto rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
                >
                  Start Building Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              <Link 
                href="#features"
                className="w-full sm:w-auto rounded-lg border-2 border-border px-8 py-4 text-base font-semibold text-foreground hover:border-accent hover:text-accent transition-all inline-flex items-center justify-center gap-2"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-accent mb-2">AI-Powered</div>
              <div className="text-sm text-muted">Smart Resume Generation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">Job Matching</div>
              <div className="text-sm text-muted">Find Perfect Opportunities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">Fast & Easy</div>
              <div className="text-sm text-muted">Build in Minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Powerful tools powered by AI to streamline your entire job search process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Portfolio Builder</h3>
              <p className="text-muted leading-relaxed mb-4">
                Chat with AI to build your professional portfolio. Upload files, share links, and watch your 
                portfolio come to life in real-time.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Natural conversation-based building</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Custom URLs for your portfolio</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Live preview as you build</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Resume Builder</h3>
              <p className="text-muted leading-relaxed mb-4">
                Generate job-specific resumes and cover letters in seconds. AI selects your most relevant 
                experience and optimizes for each position.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>AI-powered content selection</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Job matching & gap analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>ATS-friendly PDF export</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Search className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Job Search & Matching</h3>
              <p className="text-muted leading-relaxed mb-4">
                Discover opportunities from multiple sources with intelligent matching based on your skills 
                and preferences.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Multi-source job aggregation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Skills-based matching</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Remote-first opportunities</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Career Coach</h3>
              <p className="text-muted leading-relaxed mb-4">
                Get personalized advice on career strategy, interview prep, and job applications from your 
                AI assistant.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Interview preparation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Career advice & strategy</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Cover letter assistance</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Briefcase className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Application Tracking</h3>
              <p className="text-muted leading-relaxed mb-4">
                Keep track of all your applications in one place. Never lose sight of opportunities or 
                follow-ups again.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Kanban-style organization</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Application status tracking</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Notes & reminders</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-xl border border-border bg-white p-8 transition-all hover:border-accent hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Email Notifications</h3>
              <p className="text-muted leading-relaxed mb-4">
                Stay informed with beautiful email notifications for document generation, application updates, 
                and more.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Document ready alerts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Application confirmations</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Customizable preferences</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-accent/5 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Simple Process, Powerful Results
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Get from job search to job offer in four easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">1</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Build Your Profile</h3>
              <p className="text-sm text-muted">
                Chat with AI to create your portfolio and resume in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Find Opportunities</h3>
              <p className="text-sm text-muted">
                Discover jobs that match your skills and preferences
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Apply with AI</h3>
              <p className="text-sm text-muted">
                Generate tailored resumes and cover letters for each application
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">4</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Track & Win</h3>
              <p className="text-sm text-muted">
                Manage applications and prepare for interviews with AI coaching
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-lg text-muted mb-8 leading-relaxed">
            {isSignedIn 
              ? "Access all your AI-powered career tools and continue building your future."
              : "Join professionals who are landing their dream jobs faster with AI-powered tools. Start building your future today—it's free to get started."
            }
          </p>
          <Link 
            href={isSignedIn ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 text-lg font-semibold text-white hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl"
          >
            {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">Applause</span>
            </div>
            <p className="text-sm text-muted text-center">
              © 2026 Applause. Your Career Deserves Applause.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-muted hover:text-accent transition-colors">
                Sign In
              </Link>
              <Link href="/help" className="text-sm text-muted hover:text-accent transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
