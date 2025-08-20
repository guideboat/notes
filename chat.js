// --- Replace these values ---
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';
const N8N_CHAT_WEBHOOK = 'https://hogueinstitute.app.n8n.cloud/webhook/c361deb0-4745-4ac0-8542-afdcbeb75799/chat'; // From Chat Trigger panel
// --------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js';


let createChat;
try {
({ createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'));
} catch (e) {
console.error('Failed to load @n8n/chat ESM bundle:', e);
showStatus('Chat UI failed to load. Check your network and try again.');
throw e;
}


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, storage: localStorage },
});


const container = document.getElementById('chat-container');


function showStatus(msg, action) {
const box = document.createElement('div');
box.style.padding = '1rem';
box.style.border = '1px solid rgba(255,255,255,.2)';
box.style.borderRadius = '12px';
box.style.margin = '1rem 0';
box.style.background = 'rgba(0,0,0,.2)';
box.innerHTML = `<p>${msg}</p>`;
if (action) box.appendChild(action);
container.replaceChildren(box);
}


async function bootstrapSession() {
// 1) Try current session
let { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) return session;


// 2) Try to seed from our compact cache (written by auth.js)
const cachedRaw = localStorage.getItem('sb_compact');
if (cachedRaw) {
try {
const cached = JSON.parse(cachedRaw);
if (cached?.access_token && cached?.refresh_token) {
const { data, error } = await supabase.auth.setSession({
access_token: cached.access_token,
refresh_token: cached.refresh_token,
});
if (!error && data?.session?.access_token) return data.session;
console.warn('setSession failed:', error);
}
} catch (e) { console.warn('Failed to parse sb_compact:', e); }
}


// 3) Try to refresh silently (in case only a refresh_token exists internally)
try {
const { data, error } = await supabase.auth.refreshSession();
if (!error && data?.session?.access_token) return data.session;
} catch (e) { /* ignore */ }


return null;
}


function mountChat(session) {
const metadata = {
supabaseAccessToken: session.access_token,
supabaseRefreshToken: session.refresh_token,
supabaseUserId: session.user?.id,
email: session.user?.email,
};


createChat({
webhookUrl: N8N_CHAT_WEBHOOK,
metadata,
target: '#chat-container',
showWelcomeScreen: true,
defaultLanguage: 'en',
});
}


(async () => {
});
