/**
 * ATS Optimization Example
 * 
 * This file demonstrates how the ATS optimization service works
 * and what kind of output it generates.
 */

import { 
  extractJobKeywords, 
  generateATSOptimization,
  analyzeATSCompatibility 
} from '../lib/ats-optimizer';

// Example job description
const exampleJobTitle = "Senior Product Manager";
const exampleCompany = "TechCorp Inc";
const exampleJobDescription = `
We are seeking a Senior Product Manager with 5+ years of experience to lead our AI products.

Required Qualifications:
- Bachelor's degree in Computer Science, Engineering, or related field
- 5+ years of product management experience
- Strong experience with AI/ML products
- Proven track record of shipping successful products
- Experience with agile methodologies

Responsibilities:
- Lead product strategy and roadmap for AI features
- Collaborate with engineering, design, and data science teams
- Analyze user data and metrics to drive product decisions
- Conduct user research and competitive analysis
- Define and track key product metrics (KPIs)
- Work closely with stakeholders across the organization

Required Skills:
- Product Management (PM)
- AI/ML, Machine Learning
- Data Analytics, A/B Testing
- Agile, Scrum
- Stakeholder Management
- User Research
- SQL, Python (nice to have)
- Figma, JIRA

We offer competitive compensation and the opportunity to work on cutting-edge AI products.
`;

// Example usage
function demonstrateATSOptimization() {
  console.log('='.repeat(80));
  console.log('ATS OPTIMIZATION DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Extract keywords
  console.log('STEP 1: KEYWORD EXTRACTION');
  console.log('-'.repeat(80));
  const keywords = extractJobKeywords(exampleJobTitle, exampleJobDescription, exampleCompany);
  
  console.log('\n📋 Required Qualifications:');
  keywords.required.forEach(req => console.log(`   - ${req}`));
  
  console.log('\n💻 Technical Skills:');
  keywords.technical.forEach(skill => console.log(`   - ${skill}`));
  
  console.log('\n🤝 Soft Skills:');
  keywords.soft.forEach(skill => console.log(`   - ${skill}`));
  
  console.log('\n🎯 Domain Terms:');
  keywords.domain.forEach(term => console.log(`   - ${term}`));
  
  console.log('\n⚡ Action Verbs:');
  keywords.actionVerbs.forEach(verb => console.log(`   - ${verb}`));
  
  console.log('\n📅 Experience Requirements:');
  keywords.experienceRequirements.forEach(exp => console.log(`   - ${exp}`));

  // Step 2: Generate complete ATS optimization
  console.log('\n\n' + '='.repeat(80));
  console.log('STEP 2: COMPLETE ATS OPTIMIZATION');
  console.log('-'.repeat(80));
  const optimization = generateATSOptimization(exampleJobTitle, exampleJobDescription, exampleCompany);
  
  console.log('\n🎯 Priority Keywords (Top 15 - MUST Include):');
  optimization.priorityTerms.forEach((term, i) => console.log(`   ${i + 1}. "${term}"`));
  
  console.log('\n💡 Semantic Phrases (Natural Integration):');
  optimization.semanticPhrases.slice(0, 8).forEach(phrase => console.log(`   - ${phrase}`));
  
  console.log('\n📊 Industry Context:', optimization.industryContext);
  
  console.log('\n📑 Recommended Resume Structure:');
  optimization.recommendedStructure.forEach((section, i) => console.log(`   ${i + 1}. ${section}`));
  
  console.log('\n⚠️  Required Qualifications to Address:');
  optimization.requiredQualifications.slice(0, 5).forEach(qual => console.log(`   - ${qual}`));

  // Step 3: Analyze sample resume
  console.log('\n\n' + '='.repeat(80));
  console.log('STEP 3: ATS COMPATIBILITY ANALYSIS');
  console.log('-'.repeat(80));
  
  const sampleResumeText = `
PROFESSIONAL SUMMARY
Senior Product Manager with 6 years of experience leading AI and machine learning products. 
Proven track record of shipping successful products using agile methodologies. Strong background 
in data analytics, A/B testing, and stakeholder management. Led cross-functional teams to deliver 
AI-powered features that increased user engagement by 35%.

PROFESSIONAL EXPERIENCE

Senior Product Manager at Tech Company
Jan 2020 - Present
- Led product strategy and roadmap for AI/ML features, driving 40% increase in user adoption
- Collaborated with engineering, design, and data science teams to ship 3 major product releases
- Analyzed user data and metrics using SQL and Python to inform product decisions
- Conducted user research and competitive analysis to identify market opportunities
- Defined and tracked key product metrics (KPIs) including retention, engagement, conversion
- Managed stakeholder relationships across 5 cross-functional teams

Product Manager at StartupCo
Jun 2018 - Dec 2019
- Built and launched marketplace platform from 0 to 10,000 users
- Implemented agile and scrum processes across product team
- Led A/B testing program that improved conversion by 25%

SKILLS
Product Management, AI/ML, Machine Learning, Data Analytics, A/B Testing, Agile, Scrum, 
Stakeholder Management, User Research, SQL, Python, Figma, JIRA

EDUCATION
Bachelor of Science in Computer Science
University Name, 2017
  `;

  const analysis = analyzeATSCompatibility(sampleResumeText, optimization);
  
  console.log('\n📊 ATS SCORES:');
  console.log(`   Overall Score:        ${analysis.overallScore}/100`);
  console.log(`   Keyword Coverage:     ${analysis.keywordCoverage}/100`);
  console.log(`   Structure Score:      ${analysis.structureScore}/100`);
  console.log(`   Semantic Alignment:   ${analysis.semanticAlignment}/100`);
  
  console.log('\n✅ STRENGTHS:');
  analysis.strengths.forEach(strength => console.log(`   - ${strength}`));
  
  console.log('\n💡 RECOMMENDATIONS:');
  analysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
  
  if (analysis.missingKeywords.length > 0) {
    console.log('\n⚠️  MISSING PRIORITY KEYWORDS:');
    analysis.missingKeywords.slice(0, 5).forEach(keyword => console.log(`   - "${keyword}"`));
  }

  // Score interpretation
  console.log('\n\n' + '='.repeat(80));
  console.log('SCORE INTERPRETATION');
  console.log('-'.repeat(80));
  
  if (analysis.overallScore >= 80) {
    console.log('\n✅ EXCELLENT (80-100)');
    console.log('   This resume has a HIGH likelihood of passing ATS screening.');
    console.log('   It will likely be reviewed by a human recruiter.');
  } else if (analysis.overallScore >= 60) {
    console.log('\n⚠️  GOOD (60-79)');
    console.log('   This resume has a DECENT chance of passing ATS screening.');
    console.log('   Follow recommendations to improve your score.');
  } else {
    console.log('\n❌ NEEDS IMPROVEMENT (0-59)');
    console.log('   This resume needs SIGNIFICANT optimization to pass ATS.');
    console.log('   Apply the recommendations to improve your chances.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('KEY TAKEAWAYS');
  console.log('-'.repeat(80));
  console.log(`
1. Modern ATS uses NLP and semantic matching, not just keyword counting
2. Target semantic alignment score: 0.76+ (this resume: ${(analysis.semanticAlignment / 100).toFixed(2)})
3. Include ${optimization.priorityTerms.length} priority keywords naturally
4. Use the formula: "Accomplished [X] as measured by [Y], by doing [Z]"
5. ATS-optimized resumes get 3x more human views

Your generated resumes automatically target these metrics!
  `);
  console.log('='.repeat(80));
}

// Run the demonstration
if (require.main === module) {
  demonstrateATSOptimization();
}

export { demonstrateATSOptimization };
