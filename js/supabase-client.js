/* ============================================================
   SUMINREGIO INDUSTRIAL — Supabase Client v1.0
   Initializes the Supabase client and provides DB helpers
   ============================================================ */

const SUPABASE_URL = 'https://ybcrgfarxnilbzqckgoq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HdJt-jYY2_pQKhZv_acNpw_ETbEd3-q';

// Client is initialized after the CDN script loads (see auth.js)
let _sb = null;

function getSb() {
  if (!_sb) {
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.error('Supabase SDK not loaded');
      return null;
    }
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

/* ===== DB Helpers ===== */

const DB = {
  /** Get the current vendedor profile */
  async getVendedor() {
    const sb = getSb();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb.from('vendedores').select('*').eq('id', user.id).single();
    if (error) { console.error('getVendedor:', error); return null; }
    return data;
  },

  /** Save a full quote (header + items) */
  async saveCotizacion({ folio, cliente_nombre, cliente_rfc, vigencia, condiciones, tipo_precio, subtotal, iva, total, items }) {
    const sb = getSb();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Insert quote header
    const { data: cot, error: cotErr } = await sb
      .from('cotizaciones')
      .insert({
        vendedor_id: user.id,
        folio, cliente_nombre, cliente_rfc,
        vigencia, condiciones, tipo_precio,
        subtotal, iva, total
      })
      .select()
      .single();

    if (cotErr) throw cotErr;

    // Insert items
    if (items && items.length > 0) {
      const rows = items.map(it => ({
        cotizacion_id: cot.id,
        articulo_id: it.id,
        nombre: it.nombre,
        unidad: it.unidad,
        cantidad: it.qty,
        precio: it.precio,
        descuento: it.descuento || 0,
        importe: it.importe
      }));
      const { error: itemErr } = await sb.from('cotizacion_items').insert(rows);
      if (itemErr) throw itemErr;
    }

    return cot;
  },

  /** Get quote history for current user */
  async getCotizaciones(limit = 50) {
    const sb = getSb();
    const { data, error } = await sb
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('getCotizaciones:', error); return []; }
    return data;
  },

  /** Get items for a specific quote */
  async getCotizacionItems(cotizacionId) {
    const sb = getSb();
    const { data, error } = await sb
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('id');
    if (error) { console.error('getCotizacionItems:', error); return []; }
    return data;
  }
};
