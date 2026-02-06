/**
 * Translation key types
 * 
 * This file defines the structure of translation keys used throughout the app.
 * When you add new translations, update this type to get TypeScript autocompletion
 * and compile-time checking for missing translations.
 */

export type TranslationKeys = {
  nav: {
    about: string;
    experience: string;
    work: string;
    approach: string;
    skills: string;
    articles: string;
    contact: string;
  };
  categories: {
    all: string;
    ai: string;
    community: string;
    platform: string;
    edtech: string;
    discovery: string;
  };
  about: {
    heading: string;
    keyContributions: string;
    awards: string;
    intro1: string;
    intro2: string;
  };
  experience: {
    heading: string;
  };
  work: {
    heading: string;
    noProjects: string;
  };
  approach: {
    heading: string;
    whatIBring: string;
    subtitle: string;
    intro1: string;
    intro2: string;
    iExcelAt: string;
    whatIValue: string;
    whereIThrive: string;
    thriveIntro: string;
    excel: {
      zeroToOne: string;
      zeroToOneDesc: string;
      ambiguous: string;
      ambiguousDesc: string;
      scrappy: string;
      scrappyDesc: string;
      multiple: string;
      multipleDesc: string;
    };
    values: {
      bias: string;
      biasDesc: string;
      userReality: string;
      userRealityDesc: string;
      measurable: string;
      measurableDesc: string;
      crossFunctional: string;
      crossFunctionalDesc: string;
    };
    thrive: {
      earlyStage: string;
      earlyStageDesc: string;
      zeroToOne: string;
      zeroToOneDesc: string;
      aiFirst: string;
      aiFirstDesc: string;
      growthStage: string;
      growthStageDesc: string;
    };
  };
  skills: {
    heading: string;
    certifications: string;
    education: string;
  };
  articles: {
    heading: string;
  };
  contact: {
    heading: string;
    intro: string;
    emailMe: string;
    linkedin: string;
  };
  footer: {
    language: string;
    switchLanguage: string;
    copyright: string;
  };
  common: {
    close: string;
  };
  menu: {
    controlRoom: string;
    jobTools: string;
    dashboard: string;
    jobSearch: string;
    myJobs: string;
    aiAssistant: string;
    resumeBuilder: string;
    coverLetters: string;
    portfolio: string;
    collapse: string;
    expandMenu: string;
    collapseMenu: string;
    previewMode: string;
    authDisabled: string;
    profile: string;
  };
};

// Helper type to ensure all locales have the same structure
export type TranslationFile = TranslationKeys;
