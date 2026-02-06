'use client';

import { useEffect, useState } from 'react';
import { useAuthSafe } from './useAuthSafe';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'bibstarling@gmail.com';

/**
 * Hook to check if the current user has admin privileges
 * Returns: { isAdmin: boolean, isLoading: boolean }
 */
export function useIsAdmin() {
  const { user, isLoaded } = useAuthSafe();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user is the hardcoded admin
      if (user.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // Check database for admin status
      try {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('clerk_id', user.id)
          .maybeSingle();
        
        setIsAdmin(!!data?.is_admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
}
