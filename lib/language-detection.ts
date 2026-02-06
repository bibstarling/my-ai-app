/**
 * Language Detection Utility
 * 
 * Detects the language of text content (job descriptions, etc.)
 * Currently supports English and Portuguese detection
 */

import type { Locale } from '@/i18n';

// Common Portuguese words and phrases that are strong indicators
const PORTUGUESE_INDICATORS = [
  // Common words
  'com', 'para', 'por', 'que', 'não', 'mais', 'como', 'uma', 'seu', 'sua',
  'dos', 'das', 'aos', 'às', 'pelo', 'pela', 'são', 'está', 'estão',
  
  // Job-related terms
  'vaga', 'trabalho', 'empresa', 'experiência', 'requisitos', 'responsabilidades',
  'conhecimento', 'habilidades', 'benefícios', 'salário', 'contratação',
  'candidato', 'profissional', 'equipe', 'desenvolvimento', 'área',
  
  // Accented characters (strong indicators)
  'ção', 'ções', 'ão', 'ões', 'ã', 'õe', 'é', 'ê', 'á', 'à', 'ó', 'ô', 'í', 'ú',
];

// Common English words that are rarely in Portuguese
const ENGLISH_INDICATORS = [
  // Common words
  'the', 'and', 'with', 'for', 'that', 'this', 'from', 'have', 'will', 'would',
  'their', 'there', 'been', 'which', 'were', 'when', 'where', 'while',
  
  // Job-related terms
  'job', 'position', 'role', 'experience', 'requirements', 'responsibilities',
  'skills', 'knowledge', 'benefits', 'salary', 'candidate', 'professional',
  'team', 'development', 'company', 'opportunity', 'looking', 'seeking',
];

interface LanguageScore {
  language: Locale;
  score: number;
  confidence: number;
}

/**
 * Detects the language of a text
 * 
 * @param text - The text to analyze
 * @param threshold - Minimum confidence threshold (0-1), default 0.6
 * @returns The detected locale or 'unknown' if confidence is too low
 */
export function detectLanguage(
  text: string,
  threshold: number = 0.6
): Locale | 'unknown' {
  if (!text || text.trim().length < 10) {
    return 'unknown';
  }

  const normalizedText = text.toLowerCase();
  const scores = calculateLanguageScores(normalizedText);
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  const topScore = scores[0];
  
  // Check if confidence meets threshold
  if (topScore.confidence < threshold) {
    return 'unknown';
  }
  
  return topScore.language;
}

/**
 * Calculate scores for each supported language
 */
function calculateLanguageScores(text: string): LanguageScore[] {
  const ptScore = calculateScore(text, PORTUGUESE_INDICATORS);
  const enScore = calculateScore(text, ENGLISH_INDICATORS);
  
  const totalScore = ptScore + enScore;
  
  // Avoid division by zero
  if (totalScore === 0) {
    return [
      { language: 'en', score: 0, confidence: 0 },
      { language: 'pt', score: 0, confidence: 0 },
    ];
  }
  
  // Calculate confidence as the ratio of top score to total
  const ptConfidence = ptScore / totalScore;
  const enConfidence = enScore / totalScore;
  
  return [
    { language: 'pt', score: ptScore, confidence: ptConfidence },
    { language: 'en', score: enScore, confidence: enConfidence },
  ];
}

/**
 * Calculate how many indicators are found in the text
 */
function calculateScore(text: string, indicators: string[]): number {
  let score = 0;
  
  for (const indicator of indicators) {
    // Count occurrences (with word boundaries for better accuracy)
    const regex = new RegExp(`\\b${escapeRegex(indicator)}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      // Weight longer indicators more heavily
      const weight = indicator.length > 3 ? 2 : 1;
      score += matches.length * weight;
    }
  }
  
  return score;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect language from a job posting
 * Combines title and description for better accuracy
 */
export function detectJobLanguage(
  title: string,
  description: string,
  threshold: number = 0.6
): Locale | 'unknown' {
  // Combine title and description, giving title more weight
  const combinedText = `${title} ${title} ${description}`;
  return detectLanguage(combinedText, threshold);
}

/**
 * Get language name for display
 */
export function getLanguageName(language: string): string {
  const names: Record<string, string> = {
    en: 'English',
    pt: 'Português',
    unknown: 'Unknown',
  };
  return names[language] || 'Unknown';
}

/**
 * Get language emoji flag
 */
export function getLanguageFlag(language: string): string {
  const flags: Record<string, string> = {
    en: '🇬🇧',
    pt: '🇧🇷',
    unknown: '🌐',
  };
  return flags[language] || '🌐';
}

/**
 * Check if language detection is confident
 */
export function isConfidentDetection(
  text: string,
  minConfidence: number = 0.7
): boolean {
  const normalizedText = text.toLowerCase();
  const scores = calculateLanguageScores(normalizedText);
  
  scores.sort((a, b) => b.score - a.score);
  
  return scores[0].confidence >= minConfidence;
}
