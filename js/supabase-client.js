/* ============================================================
   SUMINREGIO INDUSTRIAL — Supabase Client v1.1
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

  /* ==================== COTIZACIONES ==================== */

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
        folio: folio,
        cliente_nombre: cliente_nombre || '',
        cliente_rfc: cliente_rfc || '',
        vigencia: vigencia || '15 dias',
        condiciones: condiciones || 'Contado',
        tipo_precio: tipo_precio,
        subtotal: subtotal,
        iva: iva,
        total: total
      })
      .select()
      .single();

    if (cotErr) throw cotErr;

    // Insert items
    if (items && items.length > 0) {
      const rows = items.map(function(it) {
        return {
          cotizacion_id: cot.id,
          articulo_id: it.id,
          nombre: it.nombre,
          unidad: it.unidad,
          cantidad: it.qty,
          precio: it.precio,
          descuento: it.descuento || 0,
          importe: it.importe
        };
      });
      const { error: itemErr } = await sb.from('cotizacion_items').insert(rows);
      if (itemErr) console.error('Error inserting items:', itemErr);
    }

    return cot;
  },

  /** Get quote history for current user */
  async getCotizaciones(limit) {
    if (!limit) limit = 50;
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
  },

  /* ==================== LEVANTAMIENTOS ==================== */

  /** Save a single levantamiento record (1 manguera) */
  async saveLevantamiento(record) {
    var sb = getSb();
    var result = await sb.auth.getUser();
    var user = result.data.user;
    if (!user) throw new Error('No autenticado');

    var row = {
      vendedor_id: user.id,
      fecha: record.fecha || '',
      planta: record.planta || '',
      subplanta: record.subplanta || '',
      maquina: record.maquina || '',
      equipo: record.equipo || '',
      ubicacion: record.ubicacion || '',
      diametro: record.diametro || '',
      sae: record.sae || '',
      presion: record.presion || '',
      longitud: record.longitud || '',
      recubrimiento: record.recubrimiento || '',
      con_a: record.conA || '',
      adapt_a: record.adaptA || '',
      con_b: record.conB || '',
      adapt_b: record.adaptB || '',
      comentarios: record.comentarios || '',
      descripcion: record.descripcion || ''
    };

    var resp = await sb.from('levantamientos').insert(row).select().single();
    if (resp.error) throw resp.error;
    return resp.data;
  },

  /** Save multiple levantamiento records at once */
  async saveLevantamientos(recordsArr) {
    var sb = getSb();
    var result = await sb.auth.getUser();
    var user = result.data.user;
    if (!user) throw new Error('No autenticado');

    var rows = recordsArr.map(function(record) {
      return {
        vendedor_id: user.id,
        fecha: record.fecha || '',
        planta: record.planta || '',
        subplanta: record.subplanta || '',
        maquina: record.maquina || '',
        equipo: record.equipo || '',
        ubicacion: record.ubicacion || '',
        diametro: record.diametro || '',
        sae: record.sae || '',
        presion: record.presion || '',
        longitud: record.longitud || '',
        recubrimiento: record.recubrimiento || '',
        con_a: record.conA || '',
        adapt_a: record.adaptA || '',
        con_b: record.conB || '',
        adapt_b: record.adaptB || '',
        comentarios: record.comentarios || '',
        descripcion: record.descripcion || ''
      };
    });

    var resp = await sb.from('levantamientos').insert(rows).select();
    if (resp.error) throw resp.error;
    return resp.data;
  },

  /** Get levantamiento history for current user */
  async getLevantamientos(limit) {
    if (!limit) limit = 200;
    var sb = getSb();
    var resp = await sb
      .from('levantamientos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (resp.error) { console.error('getLevantamientos:', resp.error); return []; }
    return resp.data;
  },

  /** Delete a levantamiento by ID */
  async deleteLevantamiento(id) {
    var sb = getSb();
    var resp = await sb.from('levantamientos').delete().eq('id', id);
    if (resp.error) throw resp.error;
    return true;
  }
};
