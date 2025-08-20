// --- Replace these three values ---
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnNuZnFha2N5YXVieGZlbWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzA1NjcsImV4cCI6MjA1MDU0NjU2N30.VMr9KV3dI4A8_fKkOdLkMJJHCCjgZTlnZIv6lhIHcCk';
const CHAT_PAGE = 'chat.html';
// ----------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Persist session in localStorage so chat.js can read it
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { 
        persistSession: true, 
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
});

const form = document.querySelector('#login-form');
const errorEl = document.querySelector('#error');

// Function to show error messages
function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Function to hide error messages
function hideError() {
    errorEl.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    // Disable form during submission
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
        const email = document.querySelector('#email').value.trim();
        const password = document.querySelector('#password').value;
        
        // Validate inputs
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        
        console.log('Attempting login for:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });
        
        if (error) {
            console.error('Login error:', error);
            throw error;
        }
        
        if (!data.session) {
            throw new Error('Login successful but no session created');
        }
        
        console.log('Login successful:', data.session.user.email);
        
        // Optional: store a compact payload for n8n as well
        const s = data.session;
        const compactSession = {
            access_token: s.access_token,
            refresh_token: s.refresh_token,
            user: { 
                id: s.user.id, 
                email: s.user.email 
            }
        };
        
        localStorage.setItem('sb_compact', JSON.stringify(compactSession));
        
        // Go to the chat page
        console.log('Redirecting to chat page...');
        window.location.href = CHAT_PAGE;
        
    } catch (error) {
        console.error('Authentication error:', error);
        let errorMessage = 'An error occurred during sign in';
        
        if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and confirm your account.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many login attempts. Please wait a moment and try again.';
            } else {
                errorMessage = error.message;
            }
        }
        
        showError(errorMessage);
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// If already signed in, skip straight to chat
console.log('Checking for existing session...');
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Error checking session:', error);
        return;
    }
    
    if (data?.session) {
        console.log('Existing session found, redirecting to chat...');
        window.location.href = CHAT_PAGE;
    } else {
        console.log('No existing session found');
    }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN' && session) {
        // Store compact session for n8n
        const compactSession = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: { 
                id: session.user.id, 
                email: session.user.email 
            }
        };
        localStorage.setItem('sb_compact', JSON.stringify(compactSession));
        
        // Redirect to chat if not already there
        if (!window.location.href.includes('chat.html')) {
            window.location.href = CHAT_PAGE;
        }
    }
});
