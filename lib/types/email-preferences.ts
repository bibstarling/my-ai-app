export type EmailPreferences = {
  id: string;
  user_id: string;
  account_emails: boolean;
  document_emails: boolean;
  application_emails: boolean;
  digest_emails: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailCategory = 
  | 'account'
  | 'document'
  | 'application'
  | 'digest'
  | 'marketing';

export type UpdateEmailPreferencesRequest = {
  account_emails?: boolean;
  document_emails?: boolean;
  application_emails?: boolean;
  digest_emails?: boolean;
  marketing_emails?: boolean;
};

export const EMAIL_CATEGORY_INFO = {
  account: {
    label: 'Account & Security',
    description: 'Important account updates, approvals, and security notifications',
    critical: true, // Cannot be fully disabled
    examples: ['Welcome emails', 'Account approval', 'Security alerts'],
  },
  document: {
    label: 'Document Notifications',
    description: 'Notifications when your resumes and cover letters are ready',
    critical: false,
    examples: ['Resume generated', 'Cover letter ready', 'Document updates'],
  },
  application: {
    label: 'Job Applications',
    description: 'Confirmations and updates about your job applications',
    critical: false,
    examples: ['Application tracked', 'Status updates', 'Reminders'],
  },
  digest: {
    label: 'Weekly Digests',
    description: 'Summary of your activity and new job matches',
    critical: false,
    examples: ['Weekly summary', 'Job recommendations', 'Activity reports'],
  },
  marketing: {
    label: 'Product Updates & Tips',
    description: 'New features, tips for job searching, and product announcements',
    critical: false,
    examples: ['New features', 'Job search tips', 'Product news'],
  },
} as const;
