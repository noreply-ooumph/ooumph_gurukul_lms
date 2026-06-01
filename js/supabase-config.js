// ============================================================
// OOUMPH GURUKUL LMS — Supabase Configuration
// Replace with your project credentials from:
// https://supabase.com/dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://macqondmedkskdbqyybo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hY3FvbmRtZWRrc2tkYnF5eWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTc0MjksImV4cCI6MjA5NTg3MzQyOX0.0LcY0FNhnN2WpvBTObeFXZRYYnesytAVdLV3R36vv6U';

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
