// --- Replace these three values ---
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';
const CHAT_PAGE = 'chat.html';
// ----------------------------------


import { createClient } from 'https://esm.sh/@supabase/supabase-js';


// Persist session in localStorage so chat.js can read it
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, storage: localStorage },
});


const form = document.querySelector('#login-form');
const errorEl = document.querySelector('#error');


form.addEventListener('submit', async (e) => {
e.preventDefault();
errorEl.hidden = true;


const email = /** @type {HTMLInputElement} */(document.querySelector('#email')).value.trim();
const password = /** @type {HTMLInputElement} */(document.querySelector('#password')).value;


const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
errorEl.textContent = error.message;
errorEl.hidden = false;
return;
}


// Optional: store a compact payload for n8n as well
const s = data.session;
localStorage.setItem('sb_compact', JSON.stringify({
access_token: s.access_token,
refresh_token: s.refresh_token,
user: { id: s.user.id, email: s.user.email }
}));


// Go to the chat page
window.location.href = CHAT_PAGE;
});


// If already signed in, skip straight to chat
supabase.auth.getSession().then(({ data }) => {
if (data?.session) window.location.href = CHAT_PAGE;
});
