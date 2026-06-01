// ============================================================
// OOUMPH GURUKUL LMS — Supabase Configuration
// ============================================================

const SUPABASE_URL = 'https://macqondmedkskdbqyybo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hY3FvbmRtZWRrc2tkYnF5eWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTc0MjksImV4cCI6MjA5NTg3MzQyOX0.0LcY0FNhnN2WpvBTObeFXZRYYnesytAVdLV3R36vv6U';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

const TRACKS = ['Agriculture','Healthcare','Education','Commerce','Governance','Media','Telecom','Engineering','Energy'];

// Get current user with 5s timeout safety net
async function getCurrentUser() {
  try {
    const { data: { user } } = await Promise.race([
      sb.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);
    if (!user) return null;

    const { data: profile } = await Promise.race([
      sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      new Promise(resolve => setTimeout(() => resolve({ data: null }), 4000))
    ]);

    if (profile) return profile;

    // Fallback to user metadata if DB is slow
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      full_name: meta.full_name || user.email,
      role: meta.role || 'student',
      track: meta.track || null,
      phone: null,
      qualification: null
    };
  } catch(e) {
    return null;
  }
}

async function signOut() {
  try { await sb.auth.signOut(); } catch(e) {}
  window.location.href = window.location.pathname;
}

// Clear stale session and show login — call from any portal
function forceLogin(renderLoginFn) {
  sb.auth.signOut().catch(() => {}).finally(() => renderLoginFn());
}
