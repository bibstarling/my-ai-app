// Resume builder types

export type ResumeStatus = 'draft' | 'active' | 'archived';
export type SectionType = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'custom';

export type Resume = {
  id: string;
  clerk_id: string;
  title: string;
  is_primary: boolean;
  status: ResumeStatus;
  
  // Contact info
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  
  created_at: string;
  updated_at: string;
};

// Base content types for different sections
export type SummaryContent = {
  text: string;
};

export type ExperienceContent = {
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string; // null/undefined = "Present"
  bullets: string[];
  highlights?: string[];
};

export type EducationContent = {
  degree: string;
  institution: string;
  location?: string;
  year: string;
  gpa?: string;
  description?: string;
};

export type SkillsContent = {
  category: string; // e.g., "Technical", "Leadership", "Tools"
  items: string[];
};

export type ProjectContent = {
  name: string;
  description: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  technologies?: string[];
};

export type CertificationContent = {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
  description?: string;
};

export type CustomContent = {
  text: string;
  items?: string[];
};

export type SectionContent = 
  | SummaryContent 
  | ExperienceContent 
  | EducationContent 
  | SkillsContent 
  | ProjectContent 
  | CertificationContent 
  | CustomContent;

export type ResumeSection = {
  id: string;
  resume_id: string;
  section_type: SectionType;
  title?: string;
  sort_order: number;
  content: SectionContent;
  created_at: string;
  updated_at: string;
};

export type ResumeWithSections = Resume & {
  sections: ResumeSection[];
};

export type ResumeAdaptation = {
  id: string;
  resume_id: string;
  job_id?: string;
  clerk_id: string;
  
  // Job context
  job_title: string;
  job_company: string;
  job_description?: string;
  
  // Adapted sections (same structure as ResumeSection but modified)
  adapted_sections: Omit<ResumeSection, 'id' | 'resume_id' | 'created_at' | 'updated_at'>[];
  
  // AI analysis
  match_score?: number;
  suggested_keywords: string[];
  gaps: string[];
  strengths: string[];
  ai_recommendations?: string;
  
  created_at: string;
  updated_at: string;
};

// API request/response types
export type CreateResumeRequest = {
  title: string;
  is_primary?: boolean;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
};

export type UpdateResumeRequest = Partial<CreateResumeRequest> & {
  status?: ResumeStatus;
};

export type CreateSectionRequest = {
  section_type: SectionType;
  title?: string;
  content: SectionContent;
  sort_order?: number;
};

export type UpdateSectionRequest = Partial<CreateSectionRequest>;

export type AdaptResumeRequest = {
  resume_id: string;
  job_id: string;
};

export type AdaptResumeResponse = {
  adaptation: ResumeAdaptation;
  success: boolean;
  message?: string;
};
