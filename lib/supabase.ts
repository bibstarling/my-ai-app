import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Helper to create a chainable mock for Supabase methods
const createChainableMock = (): any => {
  const chainMock: any = {
    from: () => chainMock,
    select: () => chainMock,
    insert: () => chainMock,
    update: () => chainMock,
    delete: () => chainMock,
    upsert: () => chainMock,
    eq: () => chainMock,
    neq: () => chainMock,
    gt: () => chainMock,
    gte: () => chainMock,
    lt: () => chainMock,
    lte: () => chainMock,
    like: () => chainMock,
    ilike: () => chainMock,
    is: () => chainMock,
    in: () => chainMock,
    contains: () => chainMock,
    containedBy: () => chainMock,
    rangeGt: () => chainMock,
    rangeGte: () => chainMock,
    rangeLt: () => chainMock,
    rangeLte: () => chainMock,
    rangeAdjacent: () => chainMock,
    overlaps: () => chainMock,
    textSearch: () => chainMock,
    match: () => chainMock,
    not: () => chainMock,
    or: () => chainMock,
    filter: () => chainMock,
    order: () => chainMock,
    limit: () => chainMock,
    range: () => chainMock,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    csv: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: null, error: null }),
    catch: () => chainMock,
  };
  
  return chainMock;
};

function getSupabaseClient(): SupabaseClient {
  // Check if we're on the client side and if instance already exists
  if (typeof window !== 'undefined' && supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build time to prevent errors
    // The actual client will be created at runtime when env vars are available
    if (typeof window !== 'undefined') {
      console.warn('Supabase environment variables not found. Using mock client.');
    }
    return createChainableMock() as SupabaseClient;
  }

  if (typeof window !== 'undefined') {
    // Only cache on client side
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  }

  // On server side, always create a new instance
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export as a getter to ensure lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
