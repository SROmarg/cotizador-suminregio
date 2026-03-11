-- ============================================================
-- SUMINREGIO INDUSTRIAL — Supabase Schema Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. VENDEDORES table (extends auth.users with business data)
CREATE TABLE public.vendedores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. COTIZACIONES table
CREATE TABLE public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  folio TEXT NOT NULL,
  cliente_nombre TEXT DEFAULT '',
  cliente_rfc TEXT DEFAULT '',
  vigencia TEXT DEFAULT '15 días',
  condiciones TEXT DEFAULT 'Contado',
  tipo_precio TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. COTIZACION_ITEMS table
CREATE TABLE public.cotizacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  articulo_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'PZA',
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento NUMERIC(5,2) NOT NULL DEFAULT 0,
  importe NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 4. Enable RLS on all tables
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — VENDEDORES
-- Users can read their own profile
CREATE POLICY "vendedores_select_own" ON public.vendedores
  FOR SELECT USING (auth.uid() = id);
-- Admins can read all
CREATE POLICY "vendedores_select_admin" ON public.vendedores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = auth.uid() AND v.rol = 'admin')
  );

-- 6. RLS Policies — COTIZACIONES
-- Vendedores see their own quotes
CREATE POLICY "cotizaciones_select_own" ON public.cotizaciones
  FOR SELECT USING (vendedor_id = auth.uid());
-- Vendedores insert their own quotes
CREATE POLICY "cotizaciones_insert_own" ON public.cotizaciones
  FOR INSERT WITH CHECK (vendedor_id = auth.uid());
-- Admins see all quotes
CREATE POLICY "cotizaciones_select_admin" ON public.cotizaciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = auth.uid() AND v.rol = 'admin')
  );

-- 7. RLS Policies — COTIZACION_ITEMS
-- Users can see items from their own quotes
CREATE POLICY "items_select_own" ON public.cotizacion_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cotizaciones c WHERE c.id = cotizacion_id AND c.vendedor_id = auth.uid())
  );
-- Users can insert items to their own quotes
CREATE POLICY "items_insert_own" ON public.cotizacion_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cotizaciones c WHERE c.id = cotizacion_id AND c.vendedor_id = auth.uid())
  );
-- Admins see all items
CREATE POLICY "items_select_admin" ON public.cotizacion_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = auth.uid() AND v.rol = 'admin')
  );

-- 8. Trigger: auto-create vendedor row after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendedores (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DONE! Now create your first admin user:
-- Go to Authentication → Users → Add User
-- Email: gzzgomar@gmail.com | Password: (your choice)
-- Then run:
-- UPDATE public.vendedores SET rol = 'admin', nombre = 'Omar' WHERE email = 'gzzgomar@gmail.com';
-- ============================================================
