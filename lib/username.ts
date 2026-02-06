import { createClient } from '@supabase/supabase-js';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'api', 'user', 'users', 'settings', 'portfolio', 
  'auth', 'dashboard', 'assistant', 'app', 'www', 'mail',
  'help', 'support', 'blog', 'about', 'contact', 'terms',
  'privacy', 'login', 'signup', 'logout', 'profile', 'account'
];

/**
 * Validates username format
 * - 3-30 characters
 * - Alphanumeric + hyphens only
 * - Must start and end with alphanumeric
 * - Cannot be a reserved word
 */
export function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }

  // Check format: alphanumeric + hyphens, must start and end with alphanumeric
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) {
    return {
      valid: false,
      error: 'Username must contain only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.'
    };
  }

  // Check for reserved words
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved and cannot be used' };
  }

  return { valid: true };
}

/**
 * Generates a username from an email address
 * Example: bibstarling@gmail.com -> bibstarling
 */
export function generateUsernameFromEmail(email: string): string {
  // Extract prefix from email
  const prefix = email.split('@')[0];
  
  // Convert to lowercase and replace non-alphanumeric characters with hyphens
  let username = prefix.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Remove consecutive hyphens
  username = username.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  username = username.replace(/^-+|-+$/g, '');
  
  // Ensure it's within length limits
  if (username.length < 3) {
    username = username + '123';
  }
  
  if (username.length > 30) {
    username = username.substring(0, 30);
  }
  
  // Ensure it ends with alphanumeric
  username = username.replace(/-+$/, '');
  
  return username;
}

/**
 * Checks if a username is available
 */
export async function isUsernameAvailable(
  username: string,
  supabaseUrl: string,
  supabaseKey: string,
  excludeClerkId?: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let query = supabase
    .from('users')
    .select('username')
    .eq('username', username);
  
  // Exclude current user when checking (for username updates)
  if (excludeClerkId) {
    query = query.neq('clerk_id', excludeClerkId);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
  
  return !data; // Available if no matching user found
}

/**
 * Generates a unique username from email, handling duplicates
 */
export async function generateUniqueUsername(
  email: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  const baseUsername = generateUsernameFromEmail(email);
  let username = baseUsername;
  let counter = 2;
  
  // Check if base username is available
  while (!(await isUsernameAvailable(username, supabaseUrl, supabaseKey))) {
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 100) {
      // Generate a random suffix
      const randomSuffix = Math.floor(Math.random() * 10000);
      username = `${baseUsername.substring(0, 20)}-${randomSuffix}`;
      break;
    }
  }
  
  return username;
}

/**
 * Updates a user's username
 */
export async function updateUsername(
  clerkId: string,
  newUsername: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ success: boolean; error?: string }> {
  // Validate format
  const validation = validateUsernameFormat(newUsername);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Check availability
  const available = await isUsernameAvailable(newUsername, supabaseUrl, supabaseKey, clerkId);
  if (!available) {
    return { success: false, error: 'Username is already taken' };
  }
  
  // Update username
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from('users')
    .update({
      username: newUsername,
      username_updated_at: new Date().toISOString()
    })
    .eq('clerk_id', clerkId);
  
  if (error) {
    console.error('Error updating username:', error);
    return { success: false, error: 'Failed to update username' };
  }
  
  return { success: true };
}
