'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  FileText, 
  Video,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail
} from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

type HelpSection = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles?: FAQItem[];
};

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using Applause',
    icon: <BookOpen className="w-6 h-6" />,
    articles: [
      {
        question: 'How do I create my first resume?',
        answer: 'Navigate to the "Resumes" section from the sidebar menu. Click "Create New Resume" and follow the step-by-step guide. You can import your existing resume or start from scratch with our AI-powered builder.'
      },
      {
        question: 'How does the AI Coach work?',
        answer: 'The AI Coach analyzes job descriptions and provides personalized recommendations for your applications. It helps optimize your resume, suggests cover letter improvements, and provides interview preparation tips.'
      },
      {
        question: 'Can I import my existing resume?',
        answer: 'Yes! You can upload your existing resume in PDF or DOCX format. Our AI will extract the information and structure it in our builder, making it easy to optimize and customize for different job applications.'
      }
    ]
  },
  {
    id: 'job-search',
    title: 'Job Search',
    description: 'Find and apply to jobs efficiently',
    icon: <Search className="w-6 h-6" />,
    articles: [
      {
        question: 'How do I search for jobs?',
        answer: 'Use the "Find Jobs" feature to search across multiple job boards at once. Set your preferences for location, remote work, salary range, and experience level to get personalized job matches.'
      },
      {
        question: 'What is the match percentage?',
        answer: 'The match percentage shows how well your profile aligns with a job posting. It considers your skills, experience, and preferences against the job requirements to help you focus on the best opportunities.'
      },
      {
        question: 'How do I track my applications?',
        answer: 'Go to "My Applications" to see all your job applications in one place. You can organize them by status (Applied, Interview, Offer, etc.) and set reminders for follow-ups.'
      }
    ]
  },
  {
    id: 'portfolio',
    title: 'Portfolio Builder',
    description: 'Showcase your work professionally',
    icon: <FileText className="w-6 h-6" />,
    articles: [
      {
        question: 'How do I create a portfolio?',
        answer: 'Go to the Portfolio section and click "Create Portfolio". Add your projects, case studies, and achievements. You can customize the design and layout to match your personal brand.'
      },
      {
        question: 'Can I share my portfolio?',
        answer: 'Yes! Each portfolio has a unique shareable link. You can include this link in your resume, job applications, and LinkedIn profile to showcase your work.'
      },
      {
        question: 'What should I include in my portfolio?',
        answer: 'Include your best work samples, case studies with measurable outcomes, testimonials, and a clear description of your role and impact in each project. Focus on quality over quantity.'
      }
    ]
  },
  {
    id: 'cover-letters',
    title: 'Cover Letters',
    description: 'Write compelling cover letters',
    icon: <Mail className="w-6 h-6" />,
    articles: [
      {
        question: 'How do I generate a cover letter?',
        answer: 'In the Cover Letters section, select the job you\'re applying for or paste the job description. Our AI will generate a tailored cover letter based on your experience and the job requirements.'
      },
      {
        question: 'Can I customize the generated cover letter?',
        answer: 'Absolutely! The AI-generated letter is a starting point. You can edit any section, adjust the tone, and add personal touches to make it uniquely yours.'
      },
      {
        question: 'How many cover letters can I create?',
        answer: 'You can create unlimited cover letters. We recommend customizing each one for the specific job you\'re applying to for the best results.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    description: 'Manage your account preferences',
    icon: <HelpCircle className="w-6 h-6" />,
    articles: [
      {
        question: 'How do I update my profile?',
        answer: 'Click on your profile picture in the sidebar and select "Settings". Here you can update your personal information, work preferences, and notification settings.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! We use industry-standard encryption to protect your data. Your information is never shared with third parties without your explicit consent, and you can delete your account at any time.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account and scroll to the bottom. Click "Delete Account" and follow the confirmation steps. Note that this action is permanent and cannot be undone.'
      }
    ]
  }
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-accent transition-colors"
      >
        <span className="font-medium text-gray-900">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pr-8 text-gray-600 leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

function HelpSectionCard({ section }: { section: HelpSection }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg gradient-primary text-white">
          {section.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {section.title}
          </h3>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
      </div>
      {section.articles && section.articles.length > 0 && (
        <div className="mt-4 space-y-0 border-t border-gray-100 pt-4">
          {section.articles.map((article, index) => (
            <FAQAccordion key={index} item={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = helpSections.map(section => {
    if (!searchQuery) return section;
    
    const filteredArticles = section.articles?.filter(article =>
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      ...section,
      articles: filteredArticles
    };
  }).filter(section => 
    section.articles && section.articles.length > 0 || 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary text-white mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              How can we help you?
            </h1>
            <p className="text-lg text-gray-600">
              Find answers, guides, and resources to get the most out of Applause
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-base"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {filteredSections.length > 0 ? (
          <div className="grid gap-6">
            {filteredSections.map((section) => (
              <HelpSectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No results found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-accent hover:text-accent/80 font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-br from-accent/5 to-secondary/5 rounded-xl p-8 text-center border border-accent/10">
          <Mail className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Still need help?
          </h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you succeed
          </p>
          <a
            href="mailto:bianca@biancastarling.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 grid md:grid-cols-1 gap-6 max-w-md mx-auto">
          <a
            href="#"
            className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group"
          >
            <div className="p-3 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                Video Tutorials
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </h4>
              <p className="text-sm text-gray-600">
                Watch step-by-step guides to master Applause features
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
