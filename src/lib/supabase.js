import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// A Supabase project is only considered live if it is non-empty, not a known dead placeholder,
// and not the template default placeholder key.
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('xjzvhgppbzjqbinrhujz') &&
  !rawUrl.includes('placeholder') &&
  rawKey !== 'your_supabase_anon_key_here'
);

// Fallback dummy client that resolves gracefully offline without throwing network errors
const dummyClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback) => {
      // Fire once with null session
      try { callback('INITIAL_SESSION', null); } catch {}
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Cloud auth offline') }),
  },
  from: () => ({
    select: () => ({
      order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      eq: () => ({
        is: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'local_' + Date.now() }, error: null }),
      }),
      then: (resolve) => resolve({ data: null, error: null }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  }),
};

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey)
  : dummyClient;
