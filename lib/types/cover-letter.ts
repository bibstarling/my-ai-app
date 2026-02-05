// Cover letter types

export type CoverLetterStatus = 'draft' | 'final' | 'archived';

export type CoverLetter = {
  id: string;
  clerk_id: string;
  job_id?: string;
  resume_id?: string;
  
  // Job context
  job_title: string;
  job_company: string;
  job_description?: string;
  
  // Letter content
  recipient_name?: string;
  recipient_title?: string;
  company_address?: string;
  
  opening_paragraph: string;
  body_paragraphs: string[];
  closing_paragraph: string;
  
  // Metadata
  status: CoverLetterStatus;
  tone?: string;
  
  // AI context
  selected_experiences: string[];
  selected_projects: string[];
  key_points: string[];
  
  created_at: string;
  updated_at: string;
};

export type GenerateCoverLetterRequest = {
  job_id?: string;
  job_title?: string;
  job_company?: string;
  job_description?: string;
  resume_id?: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
  recipient_name?: string;
  recipient_title?: string;
};

export type GenerateCoverLetterResponse = {
  cover_letter: CoverLetter;
  reasoning: string;
  success: boolean;
};

export type UpdateCoverLetterRequest = {
  opening_paragraph?: string;
  body_paragraphs?: string[];
  closing_paragraph?: string;
  recipient_name?: string;
  recipient_title?: string;
  company_address?: string;
  status?: CoverLetterStatus;
};
