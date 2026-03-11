/* ============================================================
   SUMINREGIO INDUSTRIAL — Shared Utilities v1.0
   ============================================================ */

/* ===== NUMBER FORMATTING ===== */
function fmt(n) {
  return '$' + (Math.round(n * 100) / 100).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ===== TOAST NOTIFICATIONS ===== */
function showToast(message, type = 'success', duration = 3000) {
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

/* ===== LOCAL STORAGE HELPERS ===== */
const Storage = {
  setCart(items) {
    try { localStorage.setItem('suminregio_cart', JSON.stringify(items)); } catch(e) {}
  },
  getCart() {
    try { return JSON.parse(localStorage.getItem('suminregio_cart') || '[]'); } catch(e) { return []; }
  },
  setQuoteHistory(quotes) {
    try { localStorage.setItem('suminregio_quotes', JSON.stringify(quotes.slice(-20))); } catch(e) {}
  },
  getQuoteHistory() {
    try { return JSON.parse(localStorage.getItem('suminregio_quotes') || '[]'); } catch(e) { return []; }
  },
  addQuote(quote) {
    const history = this.getQuoteHistory();
    history.push({
      id: quote.id,
      fecha: new Date().toISOString(),
      cliente: quote.cliente || '',
      items: quote.items.length,
      total: quote.total
    });
    this.setQuoteHistory(history);
  }
};

/* ===== HTML ESCAPE HELPER ===== */
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== SEARCH HIGHLIGHT ===== */
function hlMatch(text, query) {
  if (!query) return escHtml(text);
  var safe = escHtml(text);
  query.split(/\s+/).filter(function(w) { return w.length > 0; }).forEach(function(w) {
    safe = safe.replace(
      new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
      '<mark>$1</mark>'
    );
  });
  return safe;
}

/* ===== NUMBER TO WORDS (Spanish) ===== */
function numToWords(n) {
  const u = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
             'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISIETE',
             'DIECIOCHO','DIECINUEVE','VEINTE'];
  const d = ['','','VEINTI','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA',
             'OCHENTA','NOVENTA'];
  const ce = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
              'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  function g(x) {
    if (x === 0) return '';
    if (x === 100) return 'CIEN';
    let r = '';
    if (x >= 100) { r += ce[Math.floor(x / 100)] + ' '; x %= 100; }
    if (x <= 20) { r += u[x]; }
    else if (x < 30) { r += d[2] + u[x - 20]; }
    else { r += d[Math.floor(x / 10)]; if (x % 10) r += ' Y ' + u[x % 10]; }
    return r.trim();
  }
  const int = Math.floor(n), cents = Math.round((n - int) * 100);
  let w = '';
  if (int === 0) { w = 'CERO'; }
  else if (int >= 1000000) {
    const mill = Math.floor(int / 1000000), rest = int % 1000000;
    w = (mill === 1 ? 'UN MILLÓN' : g(mill) + ' MILLONES');
    if (rest > 0) {
      const miles = Math.floor(rest / 1000), cen = rest % 1000;
      if (miles > 0) w += ' ' + (miles === 1 ? 'MIL' : g(miles) + ' MIL');
      if (cen > 0) w += ' ' + g(cen);
    }
  } else if (int >= 1000) {
    const miles = Math.floor(int / 1000), cen = int % 1000;
    w = (miles === 1 ? 'MIL' : g(miles) + ' MIL');
    if (cen > 0) w += ' ' + g(cen);
  } else { w = g(int); }
  return w + ' PESOS ' + String(cents).padStart(2, '0') + '/100 M.N.';
}
