// --- Replace these values ---
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d';
const N8N_CHAT_WEBHOOK = 'https://hogueinstitute.app.n8n.cloud/webhook/c361deb0-4745-4ac0-8542-afdcbeb75799/chat'; // From Chat Trigger panel
const LOGIN_PAGE = 'index.html';
// --------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

let createChat;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { 
        persistSession: true, 
        storage: localStorage,
        autoRefreshToken: true 
    },
});

const container = document.getElementById('chat-container');
const userEmailEl = document.getElementById('user-email');
const logoutButton = document.getElementById('logout');

// Function to show status messages
function showStatus(msg, action) {
    const box = document.createElement('div');
    box.className = 'chat-container';
    box.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>${msg}</p>
        </div>
    `;
    if (action) {
        const actionContainer = box.querySelector('.loader-container');
        actionContainer.appendChild(action);
    }
    container.replaceChildren(box);
}

// Function to redirect to login
function redirectToLogin() {
    console.log('Redirecting to login page...');
    window.location.href = LOGIN_PAGE;
}

// Setup logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            console.log('Logging out...');
            await supabase.auth.signOut();
            localStorage.removeItem('sb_compact');
            redirectToLogin();
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            localStorage.clear();
            redirectToLogin();
        }
    });
}

// Function to get current session with multiple fallback methods
async function bootstrapSession() {
    console.log('Bootstrapping session...');
    
    try {
        // 1) Try current session first
        console.log('Checking current session...');
        let { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.warn('Error getting current session:', error);
        }
        if (session?.access_token) {
            console.log('Found current session');
            return session;
        }

        // 2) Try to restore from compact cache (written by auth.js)
        console.log('Checking compact cache...');
        const cachedRaw = localStorage.getItem('sb_compact');
        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw);
                if (cached?.access_token && cached?.refresh_token) {
                    console.log('Found cached session, attempting to restore...');
                    const { data, error } = await supabase.auth.setSession({
                        access_token: cached.access_token,
                        refresh_token: cached.refresh_token,
                    });
                    if (!error && data?.session?.access_token) {
                        console.log('Successfully restored session from cache');
                        return data.session;
                    }
                    console.warn('setSession failed:', error);
                }
            } catch (e) { 
                console.warn('Failed to parse sb_compact:', e);
                localStorage.removeItem('sb_compact'); // Clean up invalid cache
            }
        }

        // 3) Try to refresh silently (in case only a refresh_token exists internally)
        console.log('Attempting to refresh session...');
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data?.session?.access_token) {
                console.log('Successfully refreshed session');
                return data.session;
            }
        } catch (e) { 
            console.warn('Failed to refresh session:', e);
        }

        console.log('No valid session found');
        return null;
    } catch (error) {
        console.error('Error in bootstrapSession:', error);
        return null;
    }
}

// Function to load the n8n chat widget
async function loadChatWidget() {
    try {
        console.log('Loading n8n chat widget...');
        const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat@latest/dist/chat.bundle.es.js');
        return createChat;
    } catch (e) {
        console.error('Failed to load @n8n/chat ESM bundle:', e);
        throw new Error('Chat UI failed to load. Please check your network connection and try again.');
    }
}

// Function to mount the chat interface
function mountChat(session, createChatFn) {
    console.log('Mounting chat for user:', session.user?.email);
    
    // Update user email in header
    if (userEmailEl) {
        userEmailEl.textContent = session.user?.email || 'Unknown user';
    }
    
    const metadata = {
        supabaseAccessToken: session.access_token,
        supabaseRefreshToken: session.refresh_token,
        supabaseUserId: session.user?.id,
        email: session.user?.email,
    };

    try {
        createChatFn({
            webhookUrl: N8N_CHAT_WEBHOOK,
            metadata,
            target: '#chat-container',
            mode: 'fullscreen',
            showWelcomeScreen: false,
            defaultLanguage: 'en',
            initialMessages: ['Hello'],
            i18n: {
		    en: {
			    title: 'Memory Tool',
			    subtitle: "Freeform notes you control",
			    footer: '',
			    getStarted: 'New Conversation',
			    inputPlaceholder: 'Memory, task, or question..',
	    	},
	},
        });
        console.log('Chat widget mounted successfully');
    } catch (error) {
        console.error('Error mounting chat widget:', error);
        showStatus('Failed to initialize chat. Please refresh the page and try again.');
    }
}

// Main initialization function
(async () => {
    try {
        // Show loading state
        showStatus('Loading chat interface...');
        
        // Check authentication first
        const session = await bootstrapSession();
        if (!session) {
            console.log('No valid session, redirecting to login');
            redirectToLogin();
            return;
        }
        
        // Load chat widget
        showStatus('Initializing chat...');
        const createChatFn = await loadChatWidget();
        
        // Mount chat interface
        mountChat(session, createChatFn);
        
    } catch (error) {
        console.error('Initialization error:', error);
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.className = 'auth-button';
        retryButton.style.marginTop = '1rem';
        retryButton.onclick = () => window.location.reload();
        
        showStatus(error.message || 'Failed to initialize. Please try again.', retryButton);
    }
})();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change in chat:', event, session?.user?.email);
    
    if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, redirecting to login');
        localStorage.removeItem('sb_compact');
        redirectToLogin();
    }
});
