'use client';

import { useToast } from '@/app/components/ToastContainer';
import { useConfirm } from '@/app/components/ConfirmDialog';

/**
 * Unified hook for all notification needs
 * Replaces browser's alert() and confirm() with in-app UI
 */
export const useNotification = () => {
  const toast = useToast();
  const { confirm: confirmDialog } = useConfirm();

  return {
    // Toast notifications
    showSuccess: toast.showSuccess,
    showError: toast.showError,
    showInfo: toast.showInfo,
    showWarning: toast.showWarning,
    showToast: toast.showToast,
    
    // Alert replacement (use showError or showInfo instead)
    alert: (message: string, type: 'error' | 'info' | 'success' | 'warning' = 'info') => {
      toast.showToast(message, type);
    },
    
    // Confirm dialog replacement
    confirm: async (
      message: string,
      options?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
        type?: 'danger' | 'warning' | 'info';
      }
    ): Promise<boolean> => {
      return confirmDialog({
        message,
        ...options,
      });
    },
  };
};
