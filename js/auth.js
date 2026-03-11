/* ============================================================
   SUMINREGIO INDUSTRIAL — Auth Module v1.0
   Handles login, logout, session state, and user display
   ============================================================ */

const Auth = {
  _vendedor: null,
  _ready: false,
  _readyCallbacks: [],

  /** Initialize auth — call once when page loads */
  async init() {
    const sb = getSb();
    if (!sb) return;

    // Listen for auth state changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        await Auth._loadVendedor();
      } else {
        Auth._vendedor = null;
      }
      Auth._setReady();
    });

    // Check existing session
    const { data: { session } } = await sb.auth.getSession();
    if (session && session.user) {
      await Auth._loadVendedor();
    }
    Auth._setReady();
  },

  /** Login with email/password */
  async login(email, password) {
    const sb = getSb();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
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
  getVendedor() {
    return Auth._vendedor;
  },

  /** Check if user is logged in */
  isLoggedIn() {
    return Auth._vendedor !== null;
  },

  /** Check if user is admin */
  isAdmin() {
    return Auth._vendedor && Auth._vendedor.rol === 'admin';
  },

  /** Wait for auth to be ready */
  onReady(cb) {
    if (Auth._ready) { cb(); return; }
    Auth._readyCallbacks.push(cb);
  },

  /** Render user bar in platform-nav */
  renderUserNav() {
    const nav = document.querySelector('.platform-nav');
    if (!nav || !Auth._vendedor) return;

    // Remove existing user-bar if any
    const existing = nav.querySelector('.pn-user');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'pn-user';
    div.innerHTML =
      '<span class="pn-user-name">' + Auth._vendedor.nombre + '</span>' +
      (Auth._vendedor.rol === 'admin' ? '<span class="pn-user-role">Admin</span>' : '') +
      '<button class="pn-logout" onclick="Auth.logout()" title="Cerrar sesión">Salir</button>';
    nav.appendChild(div);
  },

  /* ---- Private ---- */
  async _loadVendedor() {
    try {
      Auth._vendedor = await DB.getVendedor();
    } catch (e) {
      console.error('Error loading vendedor:', e);
      Auth._vendedor = null;
    }
  },

  _setReady() {
    if (Auth._ready) return;
    Auth._ready = true;
    Auth._readyCallbacks.forEach(cb => cb());
    Auth._readyCallbacks = [];
  }
};
