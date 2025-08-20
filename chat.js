// ============================================================================
// 1) CONFIG — update these to your project values
// ============================================================================
const SUPABASE_URL   = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON  = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';

// Your n8n Chat Trigger webhook URL *ending with /chat*
const N8N_CHAT_URL   = 'https://hogueinstitute.app.n8n.cloud/webhook/c361deb0-4745-4ac0-8542-afdcbeb75799/chat';

// Optional: restrict allowed origins if you later move off GitHub Pages
const ALLOWED_ORIGINS = ['github.io'];

// ============================================================================
// 2) SUPABASE INIT (supabase-js v2 is loaded in chat.html)
// ============================================================================
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================================
// 3) UTIL: mount n8n chat using the official embed lib (preferred), with fallback
// ============================================================================
async function mountN8nChat({ jwt, email, userId }) {
  // Remove any previous chat instance (e.g., after token refresh)
  const container = document.getElementById('chat-container');
  if (!container) throw new Error('#chat-container not found');
  container.innerHTML = '<div class="loader"></div>';

  // Try loading the official embed (ESM) — works from regular <script> via dynamic import()
  let createChat = null;
  try {
    ({ createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat@latest/dist/index.min.js'));
  } catch (e) {
    console.warn('Could not load @n8n/chat embed; falling back to iframe.', e);
  }

  // Preferred: official embed with metadata (readable in n8n via $json.metadata.*)
  if (createChat) {
    container.innerHTML = ''; // clear loader
    // Many deployments work fine without extra options; these are harmless if unknown.
    createChat({
      webhookUrl: N8N_CHAT_URL,
      // Pass login context to the workflow:
      metadata: { jwt, email, userId },
      // Try to render inside our page instead of a floating bubble:
      target: '#chat-container',     // some versions accept a CSS selector or HTMLElement
      mode: 'fullscreen',            // or 'embedded' depending on your n8n version
      theme: {
        // feel free to tweak, or remove entirely
        dark: false,
      },
    });
    return;
  }

  // Fallback: plain iframe (query params included for debugging; n8n Chat Trigger
  // does NOT read them by default, but they’re handy to inspect network traffic).
  const url = new URL(N8N_CHAT_URL);
  url.searchParams.set('embed', '1');
  if (email)  url.searchParams.set('email', email);
  if (userId) url.searchParams.set('userId', userId);
  if (jwt)    url.searchParams.set('jwt', jwt);

  const iframe = document.createElement('iframe');
  iframe.src = url.toString();
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  container.innerHTML = '';
  container.appendChild(iframe);
}

// ============================================================================
// 4) PAGE BOOTSTRAP
// ============================================================================
async function setupChatPage() {
  // Basic origin hint (optional safety)
  if (!ALLOWED_ORIGINS.some((d) => location.hostname.endsWith(d))) {
    console.info('Running on', location.hostname, '(origin check is informational only)');
  }

  const userEmailEl = document.getElementById('user-email');
  const logoutBtn   = document.getElementById('logout-button');

  // Require a logged-in Supabase session
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // Display email and mount chat with metadata
  const email  = session.user?.email || '';
  const userId = session.user?.id || '';
  const jwt    = session.access_token || '';

  if (userEmailEl) userEmailEl.textContent = email || '(no email)';

  await mountN8nChat({ jwt, email, userId });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { error } = await sb.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      window.location.href = 'index.html';
    });
  }

  // If Supabase rotates the token, rebuild the chat with the fresh JWT so
  // your n8n headers continue to work:
  sb.auth.onAuthStateChange(async (event, newSession) => {
    if (!newSession) return; // probably signed out somewhere else
    if (newSession?.access_token && newSession.access_token !== jwt) {
      await mountN8nChat({
        jwt: newSession.access_token,
        email: newSession.user?.email || email,
        userId: newSession.user?.id || userId,
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', setupChatPage);
