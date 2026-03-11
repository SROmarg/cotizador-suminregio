/* ============================================================
   SUMINREGIO INDUSTRIAL — Auth Guard v1.1
   Include on EVERY page that requires authentication.
   Redirects to login.html if no active session.
   ============================================================ */

(function() {
  // Hide page content until auth is confirmed
  document.documentElement.style.visibility = 'hidden';

  // Validate redirect URL to prevent open redirect attacks
  function isValidRedirect(url) {
    if (!url) return false;
    // Only allow relative paths or same-origin URLs
    try {
      var parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin;
    } catch(e) {
      return false;
    }
  }

  // Safety timeout: if auth takes too long, redirect to login
  var timeout = setTimeout(function() {
    console.warn('Auth guard timeout - redirecting to login');
    window.location.replace('login.html');
  }, 8000);

  Auth.onReady(function() {
    clearTimeout(timeout);
    if (!Auth.isLoggedIn()) {
      // Save intended destination only if it's a valid same-origin URL
      var currentUrl = window.location.href;
      if (isValidRedirect(currentUrl)) {
        sessionStorage.setItem('suminregio_redirect', currentUrl);
      }
      window.location.replace('login.html');
      return;
    }
    // Authenticated — show page and render user nav
    document.documentElement.style.visibility = '';
    Auth.renderUserNav();
  });
})();
