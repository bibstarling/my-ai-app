// Export all email functions and types
export {
  sendWelcomeEmail,
  sendWaitingApprovalEmail,
  sendApprovalConfirmationEmail,
  sendPasswordResetEmail,
  sendJobApplicationEmail,
  sendDocumentReadyEmail,
  sendCustomEmail,
} from './send';

export { emailConfig } from './config';

export {
  shouldSendEmail,
  shouldSendEmailByClerkId,
  shouldSendEmailByAddress,
  getUserIdByEmail,
} from './preferences';
