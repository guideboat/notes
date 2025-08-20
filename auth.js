// ============================================================================
// 1. CONFIGURATION
// ============================================================================
// Replace these with your actual Supabase project URL and public anon key.
const SUPABASE_URL = 'https://opfsnfqakcyaubxfemhp.supabase.co'; // e.g., 'https://xyz.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_nL82jlMzjLIZb11001HFtQ_VMr9KV3d'; // The long string

// ============================================================================
// 2. INITIALIZE SUPABASE CLIENT
// ============================================================================
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// 3. PAGE ELEMENTS
// ============================================================================
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// ============================================================================
// 4. AUTHENTICATION LOGIC
// ============================================================================

/**
 * Handles the login form submission.
 * @param {Event} event - The form submission event.
 */
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Clear any previous error messages
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        // If login is successful, Supabase automatically handles the session.
        // Redirect to the protected chat page.
        window.location.href = 'chat.html';

    } catch (error) {
        console.error('Login failed:', error.message);
        errorMessage.textContent = `Login failed: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});

/**
 * Checks if a user is already logged in when the page loads.
 * If so, redirects them directly to the chat page.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        console.log('Active session found. Redirecting to chat...');
        window.location.href = 'chat.html';
    }
});
