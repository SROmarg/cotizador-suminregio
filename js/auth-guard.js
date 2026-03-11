/* ============================================================
   SUMINREGIO INDUSTRIAL — Auth Guard v1.1
   Include on EVERY page that requires authentication.
   Redirects to login.html if no active session.
   ============================================================ */

(function() {
  // Hide page content until auth is confirmed
  document.documentElement.style.visibility = 'hidden';

  // Safety timeout: if auth takes too long, redirect to login
  var timeout = setTimeout(function() {
    console.warn('Auth guard timeout - redirecting to login');
    window.location.replace('login.html');
  }, 8000);

  Auth.onReady(function() {
    clearTimeout(timeout);
    if (!Auth.isLoggedIn()) {
      // Save intended destination
      sessionStorage.setItem('suminregio_redirect', window.location.href);
      window.location.replace('login.html');
      return;
    }
    // Authenticated — show page and render user nav
    document.documentElement.style.visibility = '';
    Auth.renderUserNav();
  });
})();
