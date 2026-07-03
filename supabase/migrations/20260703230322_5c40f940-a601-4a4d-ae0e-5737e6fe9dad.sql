
-- Expand app_role with team roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'juridico';
