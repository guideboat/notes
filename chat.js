// --- Replace these values ---
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';
const N8N_CHAT_WEBHOOK = 'https://hogueinstitute.app.n8n.cloud/webhook/c361deb0-4745-4ac0-8542-afdcbeb75799/chat'; // From Chat Trigger panel
// --------------------------------


import { createClient } from 'https://esm.sh/@supabase/supabase-js';


let createChat;
try {
// Load the ESM bundle that exports createChat
({ createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js'));
} catch (e) {
console.error('Failed to load @n8n/chat ESM bundle:', e);
alert('Chat UI failed to load. Check your network and try again.');
throw e;
}


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
auth: { persistSession: true, storage: localStorage },
});


async function getActiveSession() {
const { data: { session } } = await supabase.auth.getSession();
if (session) return session;


const cached = localStorage.getItem('sb_compact');
if (cached) {
try { return JSON.parse(cached); } catch {}
}
return null;
}


function ensureSignedIn(session) {
if (!session?.access_token) {
window.location.href = 'index.html';
throw new Error('Not signed in');
}
}


function startN8nChat(session) {
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
// mode: 'fullscreen', // optional
});
}


getActiveSession().then((session) => {
ensureSignedIn(session);
startN8nChat(session);
});


// Log out handler
document.getElementById('logout')?.addEventListener('click', async () => {
await supabase.auth.signOut();
localStorage.removeItem('sb_compact');
window.location.href = 'index.html';
});
