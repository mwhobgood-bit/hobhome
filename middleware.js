/**
 * HOB Home OS — Site Password Gate
 * Vercel Edge Middleware: runs before any page is served.
 *
 * Set SITE_PASSWORD in Vercel → Project Settings → Environment Variables.
 * Browser will prompt for a username + password on first visit.
 * Username can be anything; only the password is checked.
 *
 * ─────────────────────────────────────────────────────────────────────
 * SECURITY ROADMAP — Phase 2 (Full Auth)
 *
 * This gate stops casual discovery but the Supabase anon key is still
 * visible in index.html source. The plan for full auth:
 *
 * 1. SUPABASE AUTH
 *    - Create one Supabase Auth account per family member (RH, BH, EH, MH)
 *    - Replace the current username/password check in index.html with
 *      supabase.auth.signInWithPassword({ email, password })
 *    - Store the returned session token; use it for all DB calls
 *
 * 2. ROW LEVEL SECURITY (RLS)
 *    - Enable RLS on: missions, players, ops, goals, events, rewards
 *    - Policy: users can only read/write rows where assigned_to matches
 *      their profile (admin accounts get full access)
 *    - With RLS on, the anon key becomes harmless — it can't read
 *      anything without a valid session
 *
 * 3. REMOVE THIS MIDDLEWARE
 *    - Once RLS is live, the simple gate is redundant
 *    - The database itself becomes the auth boundary
 *
 * Estimated effort: ~2–3 hours of app changes + 30 min Supabase config
 * ─────────────────────────────────────────────────────────────────────
 */

export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const encoded = authHeader.slice(6);
      const decoded = atob(encoded);
      const password = decoded.split(':').slice(1).join(':'); // everything after first colon
      if (password === process.env.SITE_PASSWORD) {
        return; // ✓ correct password — let the request through
      }
    } catch (_) {
      // malformed header — fall through to 401
    }
  }

  return new Response('Access denied — HOB Home OS is a private family app.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="HOB Home OS"',
      'Content-Type': 'text/plain',
    },
  });
}
