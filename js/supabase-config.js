// ============================================================
// OOUMPH GURUKUL LMS — Supabase Configuration
// Replace with your project credentials from:
// https://supabase.com/dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://macqondmedkskdbqyybo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yhmffmwsYtdmhEM4CfpCYw_fbCC_UsK';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TRACKS = ['Agriculture', 'Healthcare', 'Education', 'Commerce', 'Governance', 'Media', 'Telecom', 'Engineering', 'Energy'];

// Auth helpers
async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.reload();
}
