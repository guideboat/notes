// ============================================================================
// 1. CONFIGURATION
// ============================================================================
// Replace these with your actual Supabase project URL and public anon key.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xyz.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Replace this with your actual n8n Chat Webhook URL.
const N8N_CHAT_URL = 'YOUR_N8N_CHAT_WEBHOOK_URL';

// ============================================================================
// 2. INITIALIZE SUPABASE CLIENT
// ============================================================================
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// 3. PAGE ELEMENTS
// ============================================================================
const chatContainer = document.getElementById('chat-container');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');

// ============================================================================
// 4. PAGE PROTECTION & SETUP
// ============================================================================

/**
 * Main function to protect the page and load user-specific content.
 */
async function setupChatPage() {
    // Get the current user session
    const { data: { session }, error } = await _supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        // Redirect to login if there's an error
        window.location.href = 'index.html';
        return;
    }

    if (!session) {
        // If no user is logged in, redirect to the login page
        console.log('No active session. Redirecting to login.');
        window.location.href = 'index.html';
        return;
    }

    // If we have a session, the user is authenticated.
    const user = session.user;
    console.log('User authenticated:', user.email);

    // 1. Display user information on the page
    userEmailSpan.textContent = user.email;

    // 2. Create and embed the n8n chat iframe
    loadN8nChat(user);
}

/**
 * Creates the iframe and loads the n8n chat, passing user data as parameters.
 * @param {object} user - The authenticated Supabase user object.
 */
function loadN8nChat(user) {
    // Clear the loading indicator
    chatContainer.innerHTML = '';

    // Construct the URL with user data as query parameters
    const chatUrlWithParams = new URL(N8N_CHAT_URL);
    chatUrlWithParams.searchParams.append('email', user.email);
    chatUrlWithParams.searchParams.append('userId', user.id);
    // You can add more parameters here, like user.user_metadata.full_name if you have it

    // Create the iframe element
    const iframe = document.createElement('iframe');
    iframe.src = chatUrlWithParams.toString();
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Append the iframe to the container
    chatContainer.appendChild(iframe);
}

// ============================================================================
// 5. EVENT LISTENERS
// ============================================================================

/**
 * Handles the logout process.
 */
logoutButton.addEventListener('click', async () => {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        // Redirect to login page after successful logout
        window.location.href = 'index.html';
    }
});

// Run the setup function when the page is fully loaded
document.addEventListener('DOMContentLoaded', setupChatPage);
