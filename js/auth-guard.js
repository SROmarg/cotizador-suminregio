/* ============================================================
   SUMINREGIO INDUSTRIAL — Auth Guard v1.0
   Include this on EVERY page that requires authentication.
   Redirects to login.html if no active session.
   ============================================================ */

(function() {
  // Hide page content until auth is confirmed
  document.documentElement.style.visibility = 'hidden';

  Auth.onReady(function() {
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
