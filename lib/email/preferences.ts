import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { EmailCategory } from '@/lib/types/email-preferences';

/**
 * Check if user has enabled a specific email category
 * @param userId - The user's database ID (not Clerk ID)
 * @param category - The email category to check
 * @returns true if emails should be sent, false otherwise
 */
export async function shouldSendEmail(
  userId: string,
  category: EmailCategory
): Promise<boolean> {
  try {
    const supabase = getSupabaseServiceRole();

    // Get user's email preferences
    const { data: preferences } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // If no preferences exist, default to sending (new user)
    if (!preferences) {
      return true;
    }

    // Map category to preference field
    const categoryField = `${category}_emails` as keyof typeof preferences;
    
    return preferences[categoryField] === true;
  } catch (error) {
    console.error('Error checking email preferences:', error);
    // On error, default to sending to avoid blocking important emails
    return true;
  }
}

/**
 * Check if user has enabled a specific email category by Clerk ID
 * @param clerkId - The user's Clerk ID
 * @param category - The email category to check
 * @returns true if emails should be sent, false otherwise
 */
export async function shouldSendEmailByClerkId(
  clerkId: string,
  category: EmailCategory
): Promise<boolean> {
  try {
    const supabase = getSupabaseServiceRole();

    // Get user ID from Clerk ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (!user) {
      // User not found, default to sending
      return true;
    }

    return shouldSendEmail(user.id, category);
  } catch (error) {
    console.error('Error checking email preferences by Clerk ID:', error);
    return true;
  }
}

/**
 * Get user's database ID from email address
 * @param email - User's email address
 * @returns User's database ID or null
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const supabase = getSupabaseServiceRole();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
}

/**
 * Check email preferences by email address
 * @param email - User's email address
 * @param category - The email category to check
 * @returns true if emails should be sent, false otherwise
 */
export async function shouldSendEmailByAddress(
  email: string,
  category: EmailCategory
): Promise<boolean> {
  const userId = await getUserIdByEmail(email);
  
  if (!userId) {
    // User not found, default to sending
    return true;
  }

  return shouldSendEmail(userId, category);
}
