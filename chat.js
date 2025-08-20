// chat.js — mounts n8n chat with Supabase credentials carried via `metadata`
const SUPABASE_URL   = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON  = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';

// Your n8n Chat Trigger webhook URL *ending with /chat*
const N8N_CHAT_URL   = 'https://hogueinstitute.app.n8n.cloud/webhook/c361deb0-4745-4ac0-8542-afdcbeb75799/chat';

// Optional: restrict allowed origins if you later move off GitHub Pages
const ALLOWED_ORIGINS = ['github.io'];

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function mountN8nChat({ jwt, email, userId }) {
  const container = document.getElementById('chat-container');
  if (!container) throw new Error('#chat-container not found');
  container.innerHTML = '<div class="loader" aria-label="Loading"></div>';

  let createChat = null;
  try {
    ({ createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat@latest/dist/index.min.js'));
  } catch (e) {
    console.warn('Could not load @n8n/chat embed; falling back to iframe.', e);
  }

  if (createChat) {
    container.innerHTML = '';
    createChat({
      webhookUrl: N8N_CHAT_URL,
      metadata: { jwt, email, userId },
      target: '#chat-container',
      mode: 'fullscreen', // or 'embedded' depending on n8n version
      theme: { dark: false },
    });
    return;
  }

  // Fallback: iframe with query params for debugging only
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

async function setupChatPage() {
  if (!ALLOWED_ORIGINS.some((d) => location.hostname.endsWith(d))) {
    console.info('Origin:', location.hostname, '(origin hint only)');
  }

  const userEmailEl = document.getElementById('user-email');
  const logoutBtn   = document.getElementById('logout-button');

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const email  = session.user?.email || '';
  const userId = session.user?.id || '';
  let jwt      = session.access_token || '';

  if (userEmailEl) userEmailEl.textContent = email || '(no email)';
  await mountN8nChat({ jwt, email, userId });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { error } = await sb.auth.signOut();
      if (error) console.error('Sign out error:', error);
      window.location.href = 'index.html';
    });
  }

  sb.auth.onAuthStateChange(async (event, newSession) => {
    if (!newSession) return;
    if (newSession?.access_token && newSession.access_token !== jwt) {
      jwt = newSession.access_token;
      await mountN8nChat({
        jwt,
        email: newSession.user?.email || email,
        userId: newSession.user?.id || userId,
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', setupChatPage);
