/**
 * ATS Optimization Service - State-of-the-Art 2026
 * 
 * Modern ATS systems use NLP and BERT-based semantic matching.
 * This module provides:
 * - Keyword extraction from job descriptions
 * - Semantic alignment optimization
 * - Content structure optimization for parsing
 * - Scoring and recommendations
 * 
 * Key Stats:
 * - 75% of resumes rejected by ATS before human review
 * - 98% of Fortune 500 use ATS
 * - High-response resumes: 0.76 semantic alignment score vs 0.44 for rejected
 * - ATS-optimized resumes get 3x more human views
 */

export interface JobKeywords {
  // Core requirements - MUST include
  required: string[];
  // Technical skills & tools
  technical: string[];
  // Soft skills & competencies
  soft: string[];
  // Industry terms & domain knowledge
  domain: string[];
  // Action verbs from job description
  actionVerbs: string[];
  // Years of experience mentioned
  experienceRequirements: string[];
  // Education/certifications
  qualifications: string[];
}

export interface ATSOptimizationResult {
  keywords: JobKeywords;
  priorityTerms: string[]; // Top 15 terms to include
  semanticPhrases: string[]; // Natural phrases to weave in
  requiredQualifications: string[]; // Must address these
  recommendedStructure: string[]; // Section order for this role
  industryContext: string; // What industry/domain is this
}

/**
 * Extract comprehensive keywords from job description using advanced NLP patterns
 */
export function extractJobKeywords(
  jobTitle: string,
  jobDescription: string,
  company: string
): JobKeywords {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  // Technical skills patterns (programming languages, frameworks, tools, platforms)
  const technicalPatterns = [
    // Programming & frameworks
    /\b(python|java|javascript|typescript|react|node\.?js|vue|angular|next\.?js|django|flask|spring|\.net|c\+\+|c#|ruby|php|go|rust|swift|kotlin|scala)\b/gi,
    // Cloud & infrastructure
    /\b(aws|azure|gcp|google cloud|kubernetes|docker|terraform|jenkins|ci\/cd|devops|cloud|serverless|lambda|s3|ec2)\b/gi,
    // Data & AI/ML
    /\b(sql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|spark|hadoop|tensorflow|pytorch|machine learning|deep learning|nlp|llm|gpt|ai|data science|analytics|tableau|power bi)\b/gi,
    // Methodologies & practices
    /\b(agile|scrum|kanban|waterfall|lean|six sigma|design thinking|a\/b testing|experimentation|analytics)\b/gi,
    // Product & design tools
    /\b(figma|sketch|adobe xd|jira|confluence|asana|notion|miro|productboard|mixpanel|amplitude|segment)\b/gi,
  ];

  // Soft skills patterns
  const softSkillPatterns = [
    /\b(leadership|communication|collaboration|problem[- ]solving|analytical|strategic|creative|innovative|adaptable|team[- ]player|self[- ]motivated|detail[- ]oriented|customer[- ]focused|results?[- ]driven)\b/gi,
    /\b(stakeholder management|cross[- ]functional|influence|negotiation|mentoring|coaching|presentation|written communication|verbal communication)\b/gi,
  ];

  // Experience requirements
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:proven\s+)?(?:track\s+record|background|expertise)/gi,
    /experience\s+(?:with|in|building|developing|leading|managing)\s+([^.,;]+)/gi,
  ];

  // Required qualifications
  const qualificationPatterns = [
    /\b(bachelor'?s?|master'?s?|mba|phd|degree)\s+(?:in\s+)?([^.,;]+)/gi,
    /\b(certification|certified|certificate)\s+(?:in\s+)?([^.,;]+)/gi,
    /\b(pmp|csm|aws certified|google certified|microsoft certified|cpa|cfa)\b/gi,
  ];

  // Required terms (things that MUST be addressed)
  const requiredPatterns = [
    /(?:required|must have|essential|mandatory)[:\s]+([^.;]+)/gi,
    /(?:minimum|at least)\s+([^.;]+)/gi,
  ];

  // Action verbs used in job description (use these in resume)
  const actionVerbPatterns = [
    /\b(lead|manage|drive|build|develop|create|design|implement|execute|deliver|launch|scale|optimize|improve|grow|establish|define|collaborate|partner|influence|analyze|measure|track|monitor|evaluate|assess)\b/gi,
  ];

  // Extract matches
  const technical = new Set<string>();
  const soft = new Set<string>();
  const experienceReqs = new Set<string>();
  const qualifications = new Set<string>();
  const required = new Set<string>();
  const actionVerbs = new Set<string>();

  // Technical skills
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => technical.add(match.trim()));
  });

  // Soft skills
  softSkillPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => soft.add(match.replace(/[-\s]+/g, ' ').trim()));
  });

  // Experience requirements
  let match;
  experiencePatterns.forEach(pattern => {
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      experienceReqs.add(match[0].trim());
    }
  });

  // Qualifications
  qualificationPatterns.forEach(pattern => {
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      qualifications.add(match[0].trim());
    }
  });

  // Required terms
  requiredPatterns.forEach(pattern => {
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const requirement = match[1]?.trim();
      if (requirement && requirement.length < 100) {
        required.add(requirement);
      }
    }
  });

  // Action verbs
  actionVerbPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => actionVerbs.add(match.trim()));
  });

  // Domain/industry keywords (extract nouns and domain terms)
  const domainTerms = new Set<string>();
  const domainPatterns = [
    /\b(product management|program management|project management|product strategy|roadmap|go[- ]to[- ]market|gtm|user experience|ux|customer experience|cx|b2b|b2c|saas|marketplace|platform|api|sdk|mobile|web|e[- ]commerce|fintech|healthtech|edtech|enterprise|startup|scale[- ]up)\b/gi,
    /\b(growth|acquisition|retention|engagement|conversion|monetization|revenue|metrics|kpi|okr|roi|analytics|insights|experimentation|optimization)\b/gi,
  ];

  domainPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => domainTerms.add(match.replace(/[-\s]+/g, ' ').trim()));
  });

  return {
    required: Array.from(required),
    technical: Array.from(technical),
    soft: Array.from(soft),
    domain: Array.from(domainTerms),
    actionVerbs: Array.from(actionVerbs),
    experienceRequirements: Array.from(experienceReqs),
    qualifications: Array.from(qualifications),
  };
}

/**
 * Generate ATS optimization recommendations
 */
export function generateATSOptimization(
  jobTitle: string,
  jobDescription: string,
  company: string
): ATSOptimizationResult {
  const keywords = extractJobKeywords(jobTitle, jobDescription, company);
  
  // Prioritize keywords (top 15 terms to definitely include)
  const priorityTerms: string[] = [];
  
  // Add job title variations
  priorityTerms.push(jobTitle);
  const titleWords = jobTitle.toLowerCase().split(/\s+/);
  if (titleWords.length > 1) {
    priorityTerms.push(...titleWords.filter(w => w.length > 3));
  }

  // Add company name
  priorityTerms.push(company);

  // Add top technical skills (limit to most important)
  priorityTerms.push(...keywords.technical.slice(0, 5));
  
  // Add top domain terms
  priorityTerms.push(...keywords.domain.slice(0, 3));

  // Add critical soft skills
  const criticalSoftSkills = keywords.soft.filter(skill => 
    skill.includes('leadership') || 
    skill.includes('strategic') || 
    skill.includes('communication') ||
    skill.includes('collaboration')
  );
  priorityTerms.push(...criticalSoftSkills.slice(0, 2));

  // Deduplicate and limit to 15
  const uniquePriority = Array.from(new Set(priorityTerms)).slice(0, 15);

  // Create semantic phrases (natural ways to incorporate keywords)
  const semanticPhrases = generateSemanticPhrases(keywords, jobTitle);

  // Identify required qualifications
  const requiredQualifications = [
    ...keywords.required,
    ...keywords.experienceRequirements,
    ...keywords.qualifications,
  ].filter(Boolean);

  // Recommend section structure based on role type
  const recommendedStructure = getRecommendedStructure(jobTitle, keywords);

  // Determine industry context
  const industryContext = determineIndustryContext(jobTitle, jobDescription, keywords);

  return {
    keywords,
    priorityTerms: uniquePriority,
    semanticPhrases,
    requiredQualifications,
    recommendedStructure,
    industryContext,
  };
}

/**
 * Generate semantic phrases for natural keyword integration
 * Using the formula: "Accomplished [X] as measured by [Y], by doing [Z]"
 */
function generateSemanticPhrases(keywords: JobKeywords, jobTitle: string): string[] {
  const phrases: string[] = [];
  
  // Combine action verbs with technical skills
  keywords.actionVerbs.slice(0, 5).forEach(verb => {
    keywords.technical.slice(0, 3).forEach(tech => {
      phrases.push(`${verb} ${tech}`);
    });
  });

  // Combine action verbs with domain terms
  keywords.actionVerbs.slice(0, 3).forEach(verb => {
    keywords.domain.slice(0, 2).forEach(domain => {
      phrases.push(`${verb} ${domain}`);
    });
  });

  // Create achievement templates
  if (keywords.technical.length > 0) {
    phrases.push(`experience with ${keywords.technical.slice(0, 3).join(', ')}`);
  }

  return phrases.slice(0, 12);
}

/**
 * Recommend resume section structure based on role type
 */
function getRecommendedStructure(jobTitle: string, keywords: JobKeywords): string[] {
  const title = jobTitle.toLowerCase();
  
  // Technical roles
  if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
    return [
      'Professional Summary',
      'Technical Skills',
      'Professional Experience',
      'Projects',
      'Education',
      'Certifications',
    ];
  }
  
  // Product/PM roles
  if (title.includes('product') || title.includes('program')) {
    return [
      'Professional Summary',
      'Professional Experience',
      'Key Projects & Outcomes',
      'Skills',
      'Education',
      'Certifications',
    ];
  }

  // Design roles
  if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
    return [
      'Professional Summary',
      'Professional Experience',
      'Featured Projects',
      'Skills & Tools',
      'Education',
    ];
  }

  // Data/Analytics roles
  if (title.includes('data') || title.includes('analytics') || title.includes('scientist')) {
    return [
      'Professional Summary',
      'Technical Skills',
      'Professional Experience',
      'Projects & Research',
      'Education',
      'Publications',
    ];
  }

  // Leadership roles
  if (title.includes('director') || title.includes('head of') || title.includes('vp') || title.includes('chief')) {
    return [
      'Executive Summary',
      'Professional Experience',
      'Key Achievements',
      'Skills & Expertise',
      'Education',
      'Board Positions & Speaking',
    ];
  }

  // Default structure
  return [
    'Professional Summary',
    'Professional Experience',
    'Skills',
    'Education',
    'Certifications',
  ];
}

/**
 * Determine industry/domain context
 */
function determineIndustryContext(
  jobTitle: string,
  jobDescription: string,
  keywords: JobKeywords
): string {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  if (text.includes('fintech') || text.includes('financial') || text.includes('banking')) {
    return 'fintech';
  }
  if (text.includes('healthtech') || text.includes('health') || text.includes('medical')) {
    return 'healthtech';
  }
  if (text.includes('edtech') || text.includes('education') || text.includes('learning')) {
    return 'edtech';
  }
  if (text.includes('e-commerce') || text.includes('ecommerce') || text.includes('retail')) {
    return 'ecommerce';
  }
  if (text.includes('saas') || text.includes('software as a service')) {
    return 'saas';
  }
  if (text.includes('ai') || text.includes('machine learning') || text.includes('artificial intelligence')) {
    return 'ai/ml';
  }
  if (text.includes('marketplace') || text.includes('platform')) {
    return 'platform/marketplace';
  }
  if (text.includes('enterprise') || text.includes('b2b')) {
    return 'enterprise';
  }
  if (text.includes('consumer') || text.includes('b2c')) {
    return 'consumer';
  }
  if (text.includes('startup') || text.includes('early stage')) {
    return 'startup';
  }
  
  return 'technology';
}

/**
 * Generate ATS-optimized prompt instructions for resume generation
 */
export function getATSResumePromptInstructions(optimization: ATSOptimizationResult): string {
  return `
🎯 STATE-OF-THE-ART ATS OPTIMIZATION (2026)

Modern ATS systems use NLP and BERT-based semantic matching with Job Description Alignment Models (JDAM).
Your resume must achieve a semantic alignment score of 0.76+ to pass initial screening (75% of resumes are rejected).

📊 CRITICAL ATS REQUIREMENTS:

1. **THREE-LAYER ARCHITECTURE**:
   - MACHINE LAYER: Structured, parseable content (standard headers, single-column, left-aligned)
   - SEMANTIC LAYER: Context-rich narratives using the formula: "Accomplished [X] as measured by [Y], by doing [Z]"
   - HUMAN LAYER: Compelling story with clear value proposition

2. **PRIORITY KEYWORDS** (Must Include - Use Naturally):
${optimization.priorityTerms.map(term => `   - "${term}"`).join('\n')}

3. **SEMANTIC INTEGRATION** (Weave These Phrases Naturally):
${optimization.semanticPhrases.slice(0, 8).map(phrase => `   - ${phrase}`).join('\n')}

4. **REQUIRED QUALIFICATIONS** (MUST Address Each):
${optimization.requiredQualifications.slice(0, 5).map(qual => `   - ${qual}`).join('\n')}

5. **TECHNICAL SKILLS TO HIGHLIGHT**:
${optimization.keywords.technical.slice(0, 10).map(skill => `   - ${skill}`).join('\n')}

6. **RECOMMENDED STRUCTURE**:
${optimization.recommendedStructure.map((section, i) => `   ${i + 1}. ${section}`).join('\n')}

🚨 ATS FORMATTING RULES (CRITICAL FOR PARSING):
- Use standard section headers from recommended structure above
- Single-column layout only (NO tables, columns, text boxes)
- Left-aligned text throughout
- Consistent date format: "Jan 2020 – Mar 2023" or "January 2020 – March 2023"
- Standard fonts: Arial, Calibri, or Times New Roman
- Use simple bullets (• or -)
- NO graphics, images, or special characters
- Native heading styles (not manual formatting)

📝 CONTENT OPTIMIZATION:
- **Professional Summary**: Pack first 2-3 sentences with top 5 priority keywords naturally
- **Experience Bullets**: Use achievement formula with metrics
  Example: "Led implementation of [KEYWORD] system, increasing [METRIC] by X%, through [ACTION]"
- **Skills Section**: Include ALL relevant technical skills + domain terms explicitly
- **Keywords Distribution**: Repeat critical keywords 3-5 times across different sections naturally

💡 SEMANTIC ALIGNMENT STRATEGY:
- Use EXACT phrases from job description (not paraphrased synonyms)
- Include both spelled-out terms AND acronyms: "Product Management (PM)", "Machine Learning (ML)"
- Mirror job description's language style and terminology
- Create context-rich narratives that demonstrate competency, not just list skills
- Bold key achievements and metrics (ATS reads this as emphasis)

🎯 INDUSTRY CONTEXT: ${optimization.industryContext}
- Use industry-specific terminology and metrics relevant to ${optimization.industryContext}
- Reference common challenges and solutions in this industry
- Demonstrate domain expertise through specific examples

⚠️ AVOID (Will Hurt ATS Score):
- Generic buzzwords without context ("results-driven", "team player" without examples)
- Creative section names (use standard headers listed above)
- Skill ratings or proficiency bars (ATS can't parse these)
- Right-aligned or centered content (except name in header)
- Multiple columns or complex layouts
- Keyword stuffing without natural context
- Vague statements without metrics or outcomes

🎓 ACHIEVING 0.76+ SEMANTIC ALIGNMENT:
- Tell specific stories that naturally incorporate keywords
- Use numbers and metrics (ATS weighs quantified achievements higher)
- Match the level of seniority in language (avoid junior language for senior roles)
- Address the company's needs/challenges mentioned in job description
- Show progression and growth in career narrative
- Use action verbs from job description: ${optimization.keywords.actionVerbs.slice(0, 8).join(', ')}

Remember: Modern ATS evaluates MEANING ALIGNMENT, not just keyword frequency. 
Your resume should read naturally to humans while strategically incorporating semantic matches for AI.
`;
}

/**
 * Generate ATS-optimized prompt instructions for cover letter generation
 */
export function getATSCoverLetterPromptInstructions(optimization: ATSOptimizationResult): string {
  return `
🎯 STATE-OF-THE-ART ATS COVER LETTER OPTIMIZATION (2026)

Modern ATS systems scan cover letters for keyword alignment and semantic relevance.
Cover letters that pass ATS have 3x higher chance of human review.

📊 CRITICAL ATS + RECRUITER REQUIREMENTS:

1. **KEYWORD STRATEGY** (For ATS Scanning):
   - Include job title "${optimization.priorityTerms[0]}" in first paragraph
   - Incorporate 8-12 priority keywords naturally throughout
   - Use company name "${optimization.priorityTerms[1]}" 2-3 times
   - Mirror exact phrases from job description (not paraphrased)

2. **PRIORITY KEYWORDS TO INCLUDE**:
${optimization.priorityTerms.slice(0, 12).map(term => `   - "${term}"`).join('\n')}

3. **SEMANTIC PHRASES** (Weave Naturally):
${optimization.semanticPhrases.slice(0, 6).map(phrase => `   - ${phrase}`).join('\n')}

4. **REQUIRED QUALIFICATIONS TO ADDRESS**:
${optimization.requiredQualifications.slice(0, 4).map(qual => `   - ${qual}`).join('\n')}

📝 STRUCTURE FOR ATS + HUMAN APPEAL:

**Paragraph 1 - Opening (Hook + Keywords)**:
- State position title explicitly: "I'm writing to apply for the ${optimization.priorityTerms[0]} position"
- Include company name: "${optimization.priorityTerms[1]}"
- Hook: Show you researched the company (specific product, mission, or recent news)
- Top qualification match using 2-3 priority keywords

**Paragraph 2 - Relevant Achievement #1** (Keyword-Rich):
- Achievement formula: "Accomplished [X] as measured by [Y], by doing [Z]"
- Incorporate 3-4 technical or domain keywords naturally
- Include specific metrics and outcomes
- Use action verbs from job description: ${optimization.keywords.actionVerbs.slice(0, 5).join(', ')}

**Paragraph 3 - Relevant Achievement #2** (Demonstrate Fit):
- Second major achievement with keywords
- Connect to company's challenges/goals mentioned in description
- Include 2-3 more priority keywords
- Show cultural alignment or understanding of industry context (${optimization.industryContext})

**Paragraph 4 - Closing** (Call to Action):
- Express genuine enthusiasm for role and company
- Summarize value proposition in one sentence with final keyword integration
- Clear call to action
- Professional sign-off

🎯 KEYWORD INTEGRATION STRATEGY:
- First paragraph: 3-4 priority keywords
- Middle paragraphs: 5-6 priority keywords total
- Final paragraph: 1-2 priority keywords
- Total keyword coverage: 10-12 of the priority terms listed above

💡 AUTHENTICITY FOR HUMANS (Must Not Sound Like AI):
- Use contractions naturally (I'm, I've, that's) - sounds more human
- Vary sentence length and structure
- Avoid generic openings ("I am writing to express my interest")
- No buzzword soup or corporate jargon overload
- Sound confident but conversational
- Tell mini-stories with specific details only someone who did the work would know

⚠️ AVOID (Will Hurt ATS Score or Human Impression):
- NOT stating the position title explicitly in first paragraph
- NOT using company name enough (use 2-3 times)
- Generic statements without keywords or specifics
- Keyword stuffing that sounds unnatural
- AI clichés and overly formal language
- Vague achievements without metrics
- Not addressing required qualifications

🎓 LENGTH & TONE:
- 3-4 concise paragraphs (300-400 words total)
- Professional yet conversational
- Confident without arrogance
- Specific with metrics and outcomes
- Industry context: ${optimization.industryContext}

Remember: Balance ATS keyword requirements with human readability.
The letter must pass automated scanning AND engage the recruiter who reads it.
`;
}

/**
 * Analyze content for ATS compatibility and provide score
 */
export interface ATSAnalysisScore {
  overallScore: number; // 0-100
  keywordCoverage: number; // 0-100
  structureScore: number; // 0-100
  semanticAlignment: number; // 0-100
  recommendations: string[];
  missingKeywords: string[];
  strengths: string[];
}

export function analyzeATSCompatibility(
  content: string,
  optimization: ATSOptimizationResult
): ATSAnalysisScore {
  const contentLower = content.toLowerCase();
  
  // Keyword coverage
  const foundKeywords = optimization.priorityTerms.filter(term => 
    contentLower.includes(term.toLowerCase())
  );
  const keywordCoverage = (foundKeywords.length / optimization.priorityTerms.length) * 100;
  
  const missingKeywords = optimization.priorityTerms.filter(term => 
    !contentLower.includes(term.toLowerCase())
  );

  // Structure score (check for standard sections)
  let structureScore = 0;
  const standardSections = [
    'professional summary', 'summary', 'experience', 'professional experience',
    'skills', 'education', 'technical skills', 'projects'
  ];
  const foundSections = standardSections.filter(section => 
    contentLower.includes(section)
  );
  structureScore = (foundSections.length / 4) * 100; // Expect at least 4 sections

  // Semantic alignment (check for achievement patterns)
  let semanticAlignment = 50; // Base score
  
  // Check for metrics/numbers
  const hasMetrics = /\d+%|\d+x|\d+\+|increased|decreased|improved|reduced/gi.test(content);
  if (hasMetrics) semanticAlignment += 15;
  
  // Check for action verbs
  const actionVerbCount = optimization.keywords.actionVerbs.filter(verb =>
    contentLower.includes(verb.toLowerCase())
  ).length;
  semanticAlignment += Math.min(actionVerbCount * 5, 20);
  
  // Check for semantic phrases
  const phraseCount = optimization.semanticPhrases.filter(phrase =>
    contentLower.includes(phrase.toLowerCase())
  ).length;
  semanticAlignment += Math.min(phraseCount * 3, 15);

  semanticAlignment = Math.min(semanticAlignment, 100);

  // Overall score
  const overallScore = (keywordCoverage * 0.4) + (structureScore * 0.3) + (semanticAlignment * 0.3);

  // Recommendations
  const recommendations: string[] = [];
  const strengths: string[] = [];

  if (keywordCoverage < 60) {
    recommendations.push(`Increase keyword coverage (currently ${Math.round(keywordCoverage)}%). Add: ${missingKeywords.slice(0, 3).join(', ')}`);
  } else {
    strengths.push(`Strong keyword coverage (${Math.round(keywordCoverage)}%)`);
  }

  if (structureScore < 75) {
    recommendations.push('Use more standard section headers (Professional Summary, Experience, Skills, Education)');
  } else {
    strengths.push('Well-structured with standard sections');
  }

  if (semanticAlignment < 70) {
    recommendations.push('Add more quantifiable achievements with metrics');
    recommendations.push(`Use more action verbs from job description: ${optimization.keywords.actionVerbs.slice(0, 3).join(', ')}`);
  } else {
    strengths.push('Strong semantic alignment with context-rich content');
  }

  if (!hasMetrics) {
    recommendations.push('Include specific metrics and numbers (percentages, scale, impact)');
  }

  return {
    overallScore: Math.round(overallScore),
    keywordCoverage: Math.round(keywordCoverage),
    structureScore: Math.round(structureScore),
    semanticAlignment: Math.round(semanticAlignment),
    recommendations,
    missingKeywords,
    strengths,
  };
}
