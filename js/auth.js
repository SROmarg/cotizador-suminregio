/* ============================================================
   SUMINREGIO INDUSTRIAL — Auth Module v1.1
   Handles login, logout, session state, and user display
   ============================================================ */

const Auth = {
  _vendedor: null,
  _ready: false,
  _readyCallbacks: [],

  /** Initialize auth — call once when page loads */
  async init() {
    const sb = getSb();
    if (!sb) { Auth._setReady(); return; }

    try {
      // Check existing session first
      const { data: { session }, error } = await sb.auth.getSession();

      if (error) {
        console.warn('Auth getSession error:', error);
      } else if (session && session.user) {
        await Auth._loadVendedor();
      }
    } catch (e) {
      console.warn('Auth init error:', e);
    }

    // Always mark as ready, even if errors occurred
    Auth._setReady();

    // Listen for future auth state changes (tab focus, token refresh, etc.)
    sb.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_OUT') {
        Auth._vendedor = null;
      }
    });
  },

  /** Login with email/password */
  async login(email, password) {
    const sb = getSb();
    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    await Auth._loadVendedor();
    return data;
  },

  /** Logout */
  async logout() {
    const sb = getSb();
    await sb.auth.signOut();
    Auth._vendedor = null;
    window.location.href = 'login.html';
  },

  /** Get current vendedor (cached) */
  getVendedor: function() {
    return Auth._vendedor;
  },

  /** Check if user is logged in */
  isLoggedIn: function() {
    return Auth._vendedor !== null;
  },

  /** Check if user is admin */
  isAdmin: function() {
    return Auth._vendedor && Auth._vendedor.rol === 'admin';
  },

  /** Wait for auth to be ready */
  onReady: function(cb) {
    if (Auth._ready) { cb(); return; }
    Auth._readyCallbacks.push(cb);
  },

  /** Render user bar in platform-nav */
  renderUserNav: function() {
    var nav = document.querySelector('.platform-nav');
    if (!nav || !Auth._vendedor) return;

    // Remove existing user-bar if any
    var existing = nav.querySelector('.pn-user');
    if (existing) existing.remove();

    // Move pn-links to not use margin-left auto (user bar takes that)
    var links = nav.querySelector('.pn-links');
    if (links) links.style.marginLeft = '0';

    var div = document.createElement('div');
    div.className = 'pn-user';
    div.innerHTML =
      '<span class="pn-user-name">' + Auth._vendedor.nombre + '</span>' +
      (Auth._vendedor.rol === 'admin' ? '<span class="pn-user-role">Admin</span>' : '') +
      '<button class="pn-logout" onclick="Auth.logout()" title="Cerrar sesion">Salir</button>';
    nav.appendChild(div);
  },

  /* ---- Private ---- */
  _loadVendedor: async function() {
    try {
      Auth._vendedor = await DB.getVendedor();
    } catch (e) {
      console.warn('Error loading vendedor:', e);
      Auth._vendedor = null;
    }
  },

  _setReady: function() {
    if (Auth._ready) return;
    Auth._ready = true;
    var cbs = Auth._readyCallbacks.slice();
    Auth._readyCallbacks = [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](); } catch (e) { console.warn('onReady callback error:', e); }
    }
  }
};
