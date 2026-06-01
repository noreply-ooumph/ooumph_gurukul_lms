// ============================================================
// OOUMPH GURUKUL LMS — Supabase Configuration
// ============================================================

const SUPABASE_URL = 'https://macqondmedkskdbqyybo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hY3FvbmRtZWRrc2tkYnF5eWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTc0MjksImV4cCI6MjA5NTg3MzQyOX0.0LcY0FNhnN2WpvBTObeFXZRYYnesytAVdLV3R36vv6U';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

// Fetch full profile from DB — retries up to 3 times
async function getCurrentUser() {
  try {
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return null;

    // Retry up to 3 times with increasing delay
    for (let i = 0; i < 3; i++) {
      const { data: profile, error } = await sb.from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.track !== undefined) return profile;
      if (i < 2) await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }

    // Last resort — build from metadata but mark as incomplete
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      full_name: meta.full_name || user.email,
      role: meta.role || 'student',
      track: null,
      phone: null,
      qualification: null,
      _fallback: true
    };
  } catch(e) {
    return null;
  }
}

async function signOut() {
  try { await sb.auth.signOut(); } catch(e) {}
  window.location.href = window.location.pathname;
}
