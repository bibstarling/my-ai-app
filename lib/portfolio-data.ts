// Extract structured portfolio data for resume building
// This mirrors the data structure from app/page.tsx

export type PortfolioExperience = {
  period: string;
  title: string;
  subtitle?: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  highlights: string[];
};

export type PortfolioProject = {
  id: string;
  title: string;
  company: string;
  cardTeaser: string;
  outcome: string;
  tags: string[];
  details: {
    heading?: string;
    paragraphs?: string[];
    list?: string[];
  }[];
};

export const portfolioData = {
  fullName: 'Bianca Starling',
  title: 'Lead Product Manager',
  tagline: 'Scrappy, High-Agency Builder | 0-to-1 PM | AI Pioneer',
  email: 'bibstarling@gmail.com',
  location: 'Brasília, Brazil',
  linkedinUrl: 'https://linkedin.com/in/biancastarling',
  
  // PM Positioning - Key differentiators
  performanceLevel: 'Exceeding High Expectations',
  pmArchetype: 'Scrappy High-Agency Builder',
  superpowers: [
    'Resilient through organizational change (adapts quickly and maintains momentum)',
    'Takes on multiple complex initiatives simultaneously with massive ambiguity',
    'Proactively anticipates needs and moves fast when priorities shift',
    'Ships fast with limited resources through creative problem-solving',
    'AI pioneer with shipped products (ChatGPT App, semantic search)',
    'Cross-functional force multiplier (supports teams beyond core role)',
    'Strategic thinker ready to champion product vision and influence roadmap',
  ],
  
  // Awards (peer-validated excellence)
  awards: [
    {
      title: 'Agility Award',
      quarter: 'Q1 2025',
      description: 'Awarded for finding creative ways to ship when resources are tight, keeping multiple complex projects moving through organizational shifts.',
      keyTraits: ['Resilience', 'Behemoth Projects', 'Creative Solutions', 'Resource Optimization'],
    },
    {
      title: 'Curiosity Award',
      quarter: 'Q2 2024',
      description: 'Awarded for bringing AI innovation to product development, building practical solutions that drive real efficiency gains.',
      keyTraits: ['AI Innovation', 'Practical Solutions', 'Efficiency'],
    },
  ],
  
  experiences: [
    {
      period: 'Mar 2024 : Present',
      title: 'Lead Product Manager',
      subtitle: 'Senior Product Manager → Lead Product Manager (Nov 2025)',
      company: 'Skillshare',
      location: 'New York, USA (Remote)',
      description: 'Promoted to Lead PM in Nov 2025. Driving company-wide AI strategy and designing multi-agent systems to connect platform data with external AI tools. Delivered 25% increase in daily engagement through personalized content discovery. Led marketplace expansion with new monetization models and creator products. Architected headless CMS infrastructure for scalable content management.',
      skills: ['AI Strategy', 'MCP', 'Community Growth', 'Marketplace', 'CMS', 'Team Leadership'],
      highlights: ['🏆 Agility Award Q1 2025 - Resourcefulness and creative problem-solving', '🔬 Curiosity Award Q2 2024 - AI innovation'],
    },
    {
      period: 'Mar 2022 : Mar 2024',
      title: 'Senior Product Manager',
      company: 'Voxy',
      location: 'New York, USA (Remote)',
      description: 'Led full rebuild of publishing platform, enabling multilingual course authoring. Introduced structured user-testing practices and continuous discovery cycles. Directed unified design system creation, cutting design-to-development time. Oversaw platform integration following acquisition.',
      skills: ['Publishing Platform', 'Design Systems', 'Continuous Discovery', 'Integration'],
      highlights: ['Impressive Performance Award Jan 2023'],
    },
    {
      period: 'May 2020 - Mar 2022',
      title: 'EdTech Product Manager',
      company: 'SENAI National Department',
      location: 'Brasília, Brazil',
      description: 'Led nationwide digital transformation initiative across 500+ schools, securing multimillion-dollar funding. Built ML-based course recommendation platform with Google and Atos. Created centralized learning resources repository and AR-based industrial machinery app.',
      skills: ['Digital Transformation', 'ML/AI', 'AR', 'Government'],
      highlights: ['Google Summit Speaker 2021'],
    },
    {
      period: 'Apr 2018 - May 2020',
      title: 'Product Manager',
      company: 'Unyleya Educacional',
      location: 'Brasília, Brazil',
      description: 'Designed custom CMS reducing course publishing from 1 week to 31 minutes, driving 200% revenue increase. Led development of streaming-inspired student platform and native mobile apps.',
      skills: ['CMS', 'Mobile Apps', 'Revenue Growth', 'UX'],
      highlights: [],
    },
  ],

  projects: [
    // Skillshare (Mar 2024 - Present)
    {
      id: 'ai-strategy-foundations',
      title: 'AI Strategy and Organizational Foundations',
      company: 'Skillshare',
      cardTeaser: 'Led the definition and execution of Skillshare\'s AI strategy, establishing clear principles, shared technical foundations, and prioritization frameworks that shifted AI from isolated experiments to product-driven investments.',
      outcome: 'Aligned AI strategy across organization; clear principles and priorities; shared technical foundation; faster execution velocity',
      tags: ['AI Strategy', 'Product Vision', 'Cross-Functional Alignment', 'Systems Thinking', 'Executive Leadership'],
    },
    {
      id: 'chatgpt-ai-discovery',
      title: 'ChatGPT App and AI-Native Discovery Platform',
      company: 'Skillshare',
      cardTeaser: 'Led definition and design of Skillshare\'s AI-native discovery stack: public ChatGPT App, in-app conversational assistant, and shared semantic retrieval foundation.',
      outcome: 'Foundation for semantic in-app search, personalized discovery, and future AI assistants',
      tags: ['Semantic Search', 'Vector Retrieval', 'MCP', 'Conversational UX', 'Product Strategy'],
    },
    {
      id: 'community-feed',
      title: 'Community Feed and Engagement Discovery',
      company: 'Skillshare',
      cardTeaser: 'Led discovery, definition, and delivery of the Community Feed:a personalized feed that centralizes learning and community activity, contributing to a 25% increase in DAU/MAU.',
      outcome: '25% increase in DAU/MAU; scalable engagement surface for future personalization and AI-driven discovery',
      tags: ['Product Strategy', 'Engagement', 'Retention', 'Feed Design', 'Behavioral Analysis'],
    },
    {
      id: 'creator-hub-integration',
      title: 'Unified Creator Hub Integration (Classes, Digital Products, and Services)',
      company: 'Skillshare',
      cardTeaser: 'Led the integration that transformed the acquired company\'s teacher hub into Skillshare\'s unified Creator Hub, consolidating classes, digital products, and services into a single platform.',
      outcome: 'Unified creator interface; reduced friction from system fragmentation; increased adoption of new monetization features; scalable foundation for creator-led growth',
      tags: ['Post-Acquisition Integration', 'Platform Strategy', 'Creator UX', 'Multi-Product', 'Change Management', 'System Consolidation'],
    },
    {
      id: 'digital-products-integration',
      title: 'Digital Products Store Integration (Post-Acquisition)',
      company: 'Skillshare',
      cardTeaser: 'Led the integration of digital products from an acquired creator platform into Skillshare\'s native marketplace, preserving creator businesses while unifying discovery and purchase flows.',
      outcome: 'Unified marketplace experience; preserved creator revenue continuity; expanded monetization surface; integrated discovery flows',
      tags: ['Post-Acquisition Integration', 'Marketplace Strategy', 'Creator Monetization', 'Platform Integration', 'Risk Management'],
    },
    
    // Voxy (Mar 2022 - Mar 2024)
    
    // SENAI (May 2020 - Mar 2022)
    {
      id: 'senai-skills-gap',
      title: 'SENAI Skills GAP AI Engine',
      company: 'SENAI',
      cardTeaser: 'Led the definition and delivery of an AI-powered skills gap analysis and learning recommendation engine designed to connect labor market demand with personalized educational pathways.',
      outcome: 'New way to connect education with employability; personalized, goal-driven pathways; groundwork for scalable, AI-assisted career guidance.',
      tags: ['AI-Powered Product Design', 'Skills & Occupation Modeling', 'Recommender Systems', 'Explainable AI', 'End-to-End System Thinking'],
    },
    {
      id: 'escola-digital',
      title: 'Escola Digital National Digital Transformation',
      company: 'SENAI',
      cardTeaser: 'Led SENAI\'s national digital transformation program, creating a flexible hybrid learning model adopted across 500+ schools serving 3 million learners annually.',
      outcome: 'National digital-first education model; year-round flexible enrollment; sustainable hybrid learning at scale',
      tags: ['Digital Transformation', 'National Scale', 'Education Platform', 'Hybrid Learning', 'Product Strategy', 'Systems Design'],
    },
    {
      id: 'portal-recursos-didaticos',
      title: 'Portal de Recursos Didáticos & SCORM HUB Platform',
      company: 'SENAI',
      cardTeaser: 'Led the discovery, definition, and delivery of a national educational content platform that unified 30,000+ SCORM resources, achieved 70% cost reduction, and became the first organization globally to run SCORM in Google Classroom with progress tracking.',
      outcome: 'National adoption; 70% cost reduction; first-ever SCORM integration with Google Classroom; increased content reuse and collaboration across institutions.',
      tags: ['Platform Strategy', 'Content Distribution', 'SCORM Integration', 'Cost Optimization', 'Educator Collaboration', 'Technical Innovation'],
    },
    {
      id: 'senai-space-ar',
      title: 'SENAI Space - Augmented Reality Learning Platform',
      company: 'SENAI',
      cardTeaser: 'Led the discovery, definition, and delivery of an augmented reality learning platform that brings hands-on technical training into learners\' physical environments, extending access to complex machinery beyond physical labs.',
      outcome: 'Classroom adoption across multiple technical programs; safer, repeatable access to complex equipment concepts; expanded practical learning beyond physical infrastructure.',
      tags: ['Augmented Reality', 'Mobile Product', 'Learning Experience Design', 'Emerging Technology', 'Technical Education', 'Cross-Platform'],
    },
    {
      id: 'senai-virtual-bookshelf',
      title: 'Virtual Bookshelf App - National Access to Educational Content',
      company: 'SENAI',
      cardTeaser: 'Led the discovery, definition, and delivery of a mobile app providing nationwide access to 1,000+ free educational titles with offline reading, democratizing SENAI\'s educational content beyond formal programs.',
      outcome: 'Nationwide access to curated educational materials; offline reading for limited connectivity; increased visibility and reuse of SENAI content; reduced dependency on physical libraries.',
      tags: ['Mobile Product', 'Content Distribution', 'Offline-First Design', 'User-Centered Design', 'Accessibility', 'National Scale'],
    },
    
    // Unyleya (Apr 2018 - May 2020)
    {
      id: 'imp-online',
      title: 'IMP Online Course Publishing Platform',
      company: 'Unyleya',
      cardTeaser: 'Led the discovery, definition, and delivery of a custom CMS and student platform that reduced course publishing time from one week to 31 minutes and drove 200% revenue growth.',
      outcome: '200% revenue growth; 31-minute publishing time (from 1 week); scalable CMS and student platform foundation',
      tags: ['Platform Strategy', 'CMS Design', 'Operational Efficiency', 'Publishing Workflows', 'Revenue Growth', 'Mobile Apps'],
    },
  ],

  skills: {
    strategy: ['AI Strategy & Integrations', 'Product Vision & Roadmapping', 'Marketplace Growth', 'Go-to-Market', 'Experimentation Culture'],
    discovery: ['Continuous Discovery Habits', 'User Research & Testing', 'Opportunity Mapping', 'Problem Framing', 'Journey Mapping'],
    technical: ['Multi-Agent Systems (MCP)', 'LLM Integrations', 'Recommendation Systems', 'API Design', 'SQL', 'A/B Testing'],
    tools: ['Productboard', 'Pendo', 'Mixpanel', 'Maze', 'Builder.io', 'Figma', 'Jira', 'Tableau'],
  },

  education: [
    {
      degree: 'Specialization in Visual Arts',
      institution: 'SENAC',
      year: '2012',
    },
    {
      degree: 'Bachelor in Product Design & Graphic Design',
      institution: 'University of Brasília',
      year: '2011',
    },
  ],

  certifications: [
    {
      name: 'Product-led Certification',
      issuer: 'Pendo & Mind the Product',
    },
    {
      name: 'Identifying Hidden Assumptions',
      issuer: 'Product Talk Academy',
    },
    {
      name: 'Educational Product Manager',
      issuer: 'Future Education',
    },
    {
      name: 'Strategic Digital Transformation',
      issuer: 'TDS Company',
    },
  ],
};

export function getPortfolioSummary(emphasizeAwards: boolean = true): string {
  const base = `Product Manager who builds AI products and ships platform infrastructure. Currently leading AI strategy at Skillshare (ChatGPT App, semantic search). Track record: 25% engagement increase at Skillshare, 200% revenue at Unyleya, 500+ schools at SENAI. Good at taking messy problems and turning them into shipped products. Comfortable with ambiguity. Ready for more ownership over product strategy and direction.`;
  
  if (emphasizeAwards) {
    return `🏆 Agility Award Q1 2025 + Curiosity Award Q2 2024

${base}

What I'm good at: Running discovery that informs decisions, working with engineering to figure out what's possible, making things simpler not more complex. I get results in different contexts (startups, growth-stage, government).

What I want: Shape where the product goes, not just how we get there. Be in the room when we decide what to build next.`;
  }
  
  return base;
}

export function getPMPositioning(): string {
  return `PM ARCHETYPE: Scrappy High-Agency Builder | Exceeding High Expectations

CORE TRAITS:
- Resilient through change: Adapted quickly after RIF, maintained momentum on behemoth projects
- Takes on behemoths: Manages multiple massive initiatives simultaneously with high ambiguity
- Proactively anticipates: Plans ahead, moves fast when priorities shift
- Strategic thinker: Ready to champion product vision and influence roadmap
- AI pioneer: Ships practical AI products (ChatGPT App, semantic search), not just strategy
- Cross-functional force: Supports teams beyond core role with data and quick experiments
- Creative solver: Finds right-sized solutions with limited resources

IDEAL FOR:
- Startups and 0-to-1 teams needing resilience and fast execution
- AI/ML product roles requiring shipped products, not just roadmaps
- Strategic PM roles ready to champion vision and influence direction
- Scale-up environments with ambiguity and rapid pivots`;
}
