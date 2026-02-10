/**
 * Normalization Service
 * Converts raw job postings from different sources into canonical format
 * Deterministic and testable transformations
 */

import { RawJobPosting, NormalizedJob, JobRemoteType, JobSourceEnum } from '@/lib/types/job-intelligence';

export class NormalizationService {
  
  /**
   * Normalize a raw job posting into canonical format
   */
  normalize(raw: RawJobPosting): NormalizedJob {
    switch (raw.source) {
      case 'remoteok':
        return this.normalizeRemoteOK(raw);
      case 'remotive':
        return this.normalizeRemotive(raw);
      case 'adzuna':
        return this.normalizeAdzuna(raw);
      case 'getonboard':
        return this.normalizeGetOnBoard(raw);
      default:
        // Handle custom sources
        return this.normalizeCustomSource(raw);
    }
  }
  
  /**
   * Normalize RemoteOK job
   */
  private normalizeRemoteOK(raw: RawJobPosting): NormalizedJob {
    const data = raw.raw_data as any;
    
    const title = this.cleanText(data.position || '');
    const normalizedTitle = this.normalizeTitle(title);
    
    const skills = this.extractSkills(data.tags || []);
    const seniority = this.detectSeniority(title, '');
    const employmentType = 'Full-time';  // RemoteOK is typically full-time
    
    return {
      normalized_title: normalizedTitle,
      title,
      company_name: this.cleanText(data.company || 'Unknown'),
      company_domain: this.extractDomain(data.company || ''),
      description_text: this.cleanText(data.description || ''),
      responsibilities: this.extractResponsibilities(data.description || ''),
      requirements: this.extractRequirements(data.description || ''),
      skills,
      function: this.detectFunction(normalizedTitle, skills),
      seniority,
      employment_type: employmentType,
      remote_type: 'remote',
      remote_region_eligibility: this.detectRemoteScope(data.location || ''),
      allowed_countries: this.extractCountries(data.location || ''),
      locations: this.parseLocations(data.location || ''),
      timezone_constraints: undefined,
      compensation_min: data.salary_min,
      compensation_max: data.salary_max,
      compensation_currency: 'USD',
      compensation_period: 'year',
      language: this.detectLanguage(data.description || ''),
      apply_url: data.apply_url || data.url || '',
      job_url: data.url || '',
      posted_at: data.date ? new Date(data.date).toISOString() : undefined,
      source: raw.source,
      source_name: 'RemoteOK',
      source_job_id: raw.source_job_id,
      source_url: raw.source_url,
    };
  }
  
  /**
   * Normalize Remotive job
   */
  private normalizeRemotive(raw: RawJobPosting): NormalizedJob {
    const data = raw.raw_data as any;
    
    const title = this.cleanText(data.title || '');
    const normalizedTitle = this.normalizeTitle(title);
    const description = this.cleanText(data.description || '');
    
    const skills = this.extractSkills(data.tags || []);
    const seniority = this.detectSeniority(title, description);
    
    const salary = this.parseSalary(data.salary || '');
    
    return {
      normalized_title: normalizedTitle,
      title,
      company_name: this.cleanText(data.company_name || 'Unknown'),
      company_domain: undefined,
      description_text: description,
      responsibilities: this.extractResponsibilities(description),
      requirements: this.extractRequirements(description),
      skills,
      function: this.detectFunction(normalizedTitle, skills),
      seniority,
      employment_type: this.normalizeEmploymentType(data.job_type || ''),
      remote_type: 'remote',
      remote_region_eligibility: this.detectRemoteScope(data.candidate_required_location || ''),
      allowed_countries: this.extractCountries(data.candidate_required_location || ''),
      locations: this.parseLocations(data.candidate_required_location || ''),
      timezone_constraints: undefined,
      compensation_min: salary.min,
      compensation_max: salary.max,
      compensation_currency: salary.currency || 'USD',
      compensation_period: 'year',
      language: this.detectLanguage(description),
      apply_url: data.url || '',
      job_url: data.url || '',
      posted_at: data.publication_date ? new Date(data.publication_date).toISOString() : undefined,
      source: raw.source,
      source_name: 'Remotive',
      source_job_id: raw.source_job_id,
      source_url: raw.source_url,
    };
  }
  
  /**
   * Normalize Adzuna job
   */
  private normalizeAdzuna(raw: RawJobPosting): NormalizedJob {
    const data = raw.raw_data as any;
    
    const title = this.cleanText(data.title || '');
    const normalizedTitle = this.normalizeTitle(title);
    const description = this.cleanText(data.description || '');
    
    const skills = this.extractSkillsFromText(description);
    const seniority = this.detectSeniority(title, description);
    
    const location = data.location?.display_name || '';
    const isRemote = /remote|work from home|wfh/i.test(title + ' ' + description + ' ' + location);
    
    return {
      normalized_title: normalizedTitle,
      title,
      company_name: this.cleanText(data.company?.display_name || 'Unknown'),
      company_domain: undefined,
      description_text: description,
      responsibilities: this.extractResponsibilities(description),
      requirements: this.extractRequirements(description),
      skills,
      function: this.detectFunction(normalizedTitle, skills),
      seniority,
      employment_type: this.normalizeEmploymentType(data.contract_type || ''),
      remote_type: isRemote ? 'remote' : 'onsite',
      remote_region_eligibility: isRemote ? 'Worldwide' : undefined,
      allowed_countries: isRemote ? ['Worldwide'] : this.extractCountries(location),
      locations: this.parseLocations(location),
      timezone_constraints: undefined,
      compensation_min: data.salary_min,
      compensation_max: data.salary_max,
      compensation_currency: 'USD',
      compensation_period: 'year',
      language: this.detectLanguage(description),
      apply_url: data.redirect_url || '',
      job_url: data.redirect_url || '',
      posted_at: data.created ? new Date(data.created).toISOString() : undefined,
      source: raw.source,
      source_name: 'Adzuna',
      source_job_id: raw.source_job_id,
      source_url: raw.source_url,
    };
  }
  
  /**
   * Normalize GetOnBoard job
   */
  private normalizeGetOnBoard(raw: RawJobPosting): NormalizedJob {
    const data = raw.raw_data as any;
    const attrs = data.attributes || {};
    
    const title = this.cleanText(attrs.title || '');
    const normalizedTitle = this.normalizeTitle(title);
    const description = this.cleanText(attrs.description || '');
    
    const functionNames = attrs.functions?.data?.map((f: any) => f.attributes?.name).filter(Boolean) || [];
    const skills = this.extractSkillsFromText(description);
    
    const seniorityName = attrs.seniority?.data?.attributes?.name;
    const seniority = seniorityName ? this.normalizeSeniority(seniorityName) : this.detectSeniority(title, description);
    
    const isRemote = attrs.remote === true;
    const remoteModality = attrs['remote-modality'];
    const remoteZone = attrs['remote-zone'];
    
    let remoteType: JobRemoteType = 'onsite';
    if (isRemote) {
      remoteType = remoteModality === 'full' ? 'remote' : 'hybrid';
    }
    
    return {
      normalized_title: normalizedTitle,
      title,
      company_name: this.cleanText(attrs.company?.data?.attributes?.name || 'Unknown'),
      company_domain: undefined,
      description_text: description,
      responsibilities: this.extractResponsibilities(description),
      requirements: this.extractRequirements(description),
      skills,
      function: functionNames[0] || this.detectFunction(normalizedTitle, skills),
      seniority,
      employment_type: 'Full-time',
      remote_type: remoteType,
      remote_region_eligibility: remoteZone || (isRemote ? 'LATAM' : undefined),
      allowed_countries: remoteZone ? this.extractCountries(remoteZone) : ['LATAM'],
      locations: remoteZone ? this.parseLocations(remoteZone) : ['LATAM'],
      timezone_constraints: undefined,
      compensation_min: attrs['min-salary'],
      compensation_max: attrs['max-salary'],
      compensation_currency: attrs.currency || 'USD',
      compensation_period: 'month',
      language: this.detectLanguage(description),
      apply_url: data.links?.['public-url'] || '',
      job_url: data.links?.['public-url'] || '',
      posted_at: attrs['published-at'] ? new Date(attrs['published-at']).toISOString() : undefined,
      source: raw.source,
      source_name: 'GetOnBoard',
      source_job_id: raw.source_job_id,
      source_url: raw.source_url,
    };
  }
  
  /**
   * Normalize Custom Source job
   */
  private normalizeCustomSource(raw: RawJobPosting): NormalizedJob {
    const data = raw.raw_data as any;
    
    const title = this.cleanText(data.title || '');
    const normalizedTitle = this.normalizeTitle(title);
    const description = this.cleanText(data.description || '');
    
    const skills = this.extractSkillsFromText(description);
    const seniority = this.detectSeniority(title, description);
    
    return {
      normalized_title: normalizedTitle,
      title,
      company_name: this.cleanText(data.company || 'Unknown Company'),
      company_domain: undefined,
      description_text: description,
      responsibilities: this.extractResponsibilities(description),
      requirements: this.extractRequirements(description),
      skills,
      function: this.detectFunction(normalizedTitle, skills),
      seniority,
      employment_type: this.normalizeEmploymentType(data.employment_type || ''),
      remote_type: this.detectRemoteType(data.remote_type, title, description, data.location),
      remote_region_eligibility: undefined,
      allowed_countries: data.location ? this.extractCountries(data.location) : [],
      locations: data.location ? this.parseLocations(data.location) : [],
      timezone_constraints: undefined,
      compensation_min: undefined,
      compensation_max: undefined,
      compensation_currency: undefined,
      compensation_period: undefined,
      language: this.detectLanguage(description),
      apply_url: data.url || '',
      job_url: data.url || '',
      posted_at: data.date ? new Date(data.date).toISOString() : undefined,
      source: raw.source,
      source_name: data.source_name, // Use source_name from raw_data
      source_job_id: raw.source_job_id,
      source_url: raw.source_url,
    };
  }
  
  // ===== Utility Methods =====
  
  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  private normalizeTitle(title: string): string {
    return title
      .replace(/\s*[-–|]\s*.*$/, '')  // Remove company/location suffix
      .replace(/\([^)]*\)/g, '')  // Remove parenthetical
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private detectSeniority(title: string, description: string): string | undefined {
    const text = (title + ' ' + description).toLowerCase();
    
    if (/\b(senior|sr\.?|lead|principal|staff)\b/i.test(text)) return 'Senior';
    if (/\b(mid|intermediate)\b/i.test(text)) return 'Mid';
    if (/\b(junior|jr\.?|entry|associate)\b/i.test(text)) return 'Junior';
    if (/\b(intern|internship)\b/i.test(text)) return 'Intern';
    if (/\b(director|head of|vp|vice president|chief|cto|ceo)\b/i.test(text)) return 'Executive';
    
    return undefined;
  }
  
  private normalizeSeniority(seniority: string): string {
    const s = seniority.toLowerCase();
    if (s.includes('senior') || s.includes('sr')) return 'Senior';
    if (s.includes('mid') || s.includes('intermediate')) return 'Mid';
    if (s.includes('junior') || s.includes('jr') || s.includes('entry')) return 'Junior';
    if (s.includes('intern')) return 'Intern';
    if (s.includes('director') || s.includes('executive') || s.includes('lead')) return 'Executive';
    return seniority;
  }
  
  private detectFunction(title: string, skills: string[]): string | undefined {
    const text = (title + ' ' + skills.join(' ')).toLowerCase();
    
    if (/\b(engineer|developer|programmer|software|backend|frontend|fullstack|devops|sre)\b/i.test(text)) return 'Engineering';
    if (/\b(product|pm|product manager)\b/i.test(text)) return 'Product';
    if (/\b(design|designer|ux|ui|visual)\b/i.test(text)) return 'Design';
    if (/\b(data|analyst|analytics|scientist|ml|machine learning|ai)\b/i.test(text)) return 'Data';
    if (/\b(marketing|growth|seo|content)\b/i.test(text)) return 'Marketing';
    if (/\b(sales|account|customer success)\b/i.test(text)) return 'Sales';
    if (/\b(support|customer service|help desk)\b/i.test(text)) return 'Support';
    if (/\b(hr|human resources|recruiting|recruiter|people)\b/i.test(text)) return 'HR';
    if (/\b(finance|accounting|financial)\b/i.test(text)) return 'Finance';
    if (/\b(operations|ops|project manager|program manager)\b/i.test(text)) return 'Operations';
    
    return undefined;
  }
  
  private normalizeEmploymentType(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('full') || t.includes('tiempo completo')) return 'Full-time';
    if (t.includes('part') || t.includes('medio tiempo')) return 'Part-time';
    if (t.includes('contract') || t.includes('contrato')) return 'Contract';
    if (t.includes('intern') || t.includes('pasantía')) return 'Internship';
    return 'Full-time';  // Default
  }
  
  private extractSkills(tags: string[]): string[] {
    return tags
      .map(tag => this.cleanText(tag))
      .filter(tag => tag.length > 1 && tag.length < 30)
      .slice(0, 20);
  }
  
  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Rails',
      'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
      'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL', 'SQL', 'NoSQL',
    ];
    
    const found = commonSkills.filter(skill => {
      // Escape special regex characters
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escapedSkill}\\b`, 'i').test(text);
    });
    
    return found.slice(0, 15);
  }
  
  private extractResponsibilities(description: string): string | undefined {
    const patterns = [
      /responsibilities:?\s*\n([\s\S]*?)(?=\n\n|requirements|qualifications|$)/i,
      /you will:?\s*\n([\s\S]*?)(?=\n\n|requirements|qualifications|$)/i,
      /role:?\s*\n([\s\S]*?)(?=\n\n|requirements|qualifications|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        return this.cleanText(match[1]).slice(0, 2000);
      }
    }
    
    return undefined;
  }
  
  private extractRequirements(description: string): string | undefined {
    const patterns = [
      /requirements:?\s*\n([\s\S]*?)(?=\n\n|benefits|compensation|$)/i,
      /qualifications:?\s*\n([\s\S]*?)(?=\n\n|benefits|compensation|$)/i,
      /you have:?\s*\n([\s\S]*?)(?=\n\n|benefits|compensation|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        return this.cleanText(match[1]).slice(0, 2000);
      }
    }
    
    return undefined;
  }
  
  private detectRemoteType(remoteTypeHint: string | null, title: string, description: string, location?: string): JobRemoteType {
    // First check if explicitly provided
    if (remoteTypeHint) {
      const hint = remoteTypeHint.toLowerCase();
      if (hint.includes('remote')) return 'remote';
      if (hint.includes('hybrid')) return 'hybrid';
      if (hint.includes('onsite') || hint.includes('office')) return 'onsite';
    }
    
    // Fall back to detecting from text
    const text = `${title} ${description} ${location || ''}`.toLowerCase();
    
    if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) {
      return 'remote';
    }
    
    if (text.includes('hybrid')) {
      return 'hybrid';
    }
    
    if (text.includes('onsite') || text.includes('in-office')) {
      return 'onsite';
    }
    
    return 'unknown';
  }
  
  private detectRemoteScope(location: string): string | undefined {
    const loc = location.toLowerCase();
    
    if (/worldwide|anywhere|global/i.test(loc)) return 'Worldwide';
    if (/us|usa|united states/i.test(loc)) return 'US';
    if (/europe|eu/i.test(loc)) return 'Europe';
    if (/latam|latin america|south america/i.test(loc)) return 'LATAM';
    if (/asia|apac/i.test(loc)) return 'Asia';
    
    return undefined;
  }
  
  private extractCountries(location: string): string[] {
    const countries: string[] = [];
    const loc = location.toLowerCase();
    
    if (/worldwide|anywhere|global/i.test(loc)) return ['Worldwide'];
    
    const countryPatterns = [
      { pattern: /\buses?\b|united states|usa/i, code: 'US' },
      { pattern: /\buk\b|united kingdom|britain/i, code: 'GB' },
      { pattern: /canada/i, code: 'CA' },
      { pattern: /brazil|brasil/i, code: 'BR' },
      { pattern: /mexico|méxico/i, code: 'MX' },
      { pattern: /argentina/i, code: 'AR' },
      { pattern: /colombia/i, code: 'CO' },
      { pattern: /chile/i, code: 'CL' },
      { pattern: /germany|deutschland/i, code: 'DE' },
      { pattern: /france/i, code: 'FR' },
      { pattern: /spain|españa/i, code: 'ES' },
      { pattern: /netherlands/i, code: 'NL' },
      { pattern: /australia/i, code: 'AU' },
      { pattern: /india/i, code: 'IN' },
    ];
    
    for (const { pattern, code } of countryPatterns) {
      if (pattern.test(loc)) {
        countries.push(code);
      }
    }
    
    return countries.length > 0 ? countries : ['US'];  // Default to US
  }
  
  private parseLocations(location: string): string[] {
    if (!location) return [];
    
    return location
      .split(/[,;]/)
      .map(loc => this.cleanText(loc))
      .filter(loc => loc.length > 0)
      .slice(0, 5);
  }
  
  private detectLanguage(text: string): string {
    // Simple heuristic: check for common words in different languages
    const portuguese = /\b(você|está|para|com|trabalho|empresa|desenvolvimento)\b/i;
    const spanish = /\b(usted|está|para|con|trabajo|empresa|desarrollo)\b/i;
    
    if (portuguese.test(text)) return 'pt-BR';
    if (spanish.test(text)) return 'es';
    
    return 'en';  // Default to English
  }
  
  private extractDomain(text: string): string | undefined {
    try {
      if (text.includes('@')) {
        return text.split('@')[1].toLowerCase();
      }
      const url = new URL(text.startsWith('http') ? text : `https://${text}`);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return undefined;
    }
  }
  
  private parseSalary(salaryText: string): { min?: number; max?: number; currency?: string } {
    if (!salaryText) return {};
    
    const result: { min?: number; max?: number; currency?: string } = {};
    
    const currencyMatch = salaryText.match(/\b(USD|EUR|GBP|BRL|CAD|AUD|MXN|\$|€|£)\b/i);
    if (currencyMatch) {
      const symbol = currencyMatch[1];
      result.currency = symbol === '$' ? 'USD' : symbol === '€' ? 'EUR' : symbol === '£' ? 'GBP' : symbol;
    }
    
    const numbers = salaryText.match(/\d+[,.]?\d*[kK]?/g) || [];
    const parsed = numbers.map(n => {
      let val = parseFloat(n.replace(/,/g, ''));
      if (/[kK]/.test(n)) val *= 1000;
      return val;
    });
    
    if (parsed.length === 1) {
      result.min = parsed[0];
      result.max = parsed[0];
    } else if (parsed.length >= 2) {
      result.min = Math.min(...parsed);
      result.max = Math.max(...parsed);
    }
    
    return result;
  }
}
