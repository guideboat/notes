// auth.js — handles Supabase login and redirects to chat.html
const SUPABASE_URL  = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

async function ensureSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    window.location.href = 'chat.html';
  }
}

async function main() {
  await ensureSession();

  document.getElementById('login-github')?.addEventListener('click', async () => {
    const redirectTo = new URL('chat.html', window.location.href).toString();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo }
    });
    if (error) {
      const el = document.getElementById('error-message');
      if (el) {
        el.textContent = 'GitHub auth error: ' + error.message;
        el.style.display = 'block';
      } else {
        alert('GitHub auth error: ' + error.message);
      }
    }
  });

  document.getElementById('login-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    if (!email || !password) {
      const el = document.getElementById('error-message');
      if (el) {
        el.textContent = 'Enter email + password';
        el.style.display = 'block';
      } else {
        alert('Enter email + password');
      }
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const el = document.getElementById('error-message');
      if (el) {
        el.textContent = 'Email login error: ' + error.message;
        el.style.display = 'block';
      } else {
        alert('Email login error: ' + error.message);
      }
      return;
    }
    window.location.href = 'chat.html';
  });
}

document.addEventListener('DOMContentLoaded', main);
