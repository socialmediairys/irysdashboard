
ALTER TABLE public.entradas_financeiras
  ADD COLUMN IF NOT EXISTS is_fixed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_day integer,
  ADD COLUMN IF NOT EXISTS fixed_template_id uuid REFERENCES public.entradas_financeiras(id) ON DELETE SET NULL;

ALTER TABLE public.entradas_financeiras
  DROP CONSTRAINT IF EXISTS entradas_financeiras_recurrence_day_check;
ALTER TABLE public.entradas_financeiras
  ADD CONSTRAINT entradas_financeiras_recurrence_day_check
  CHECK (recurrence_day IS NULL OR (recurrence_day BETWEEN 1 AND 31));

CREATE INDEX IF NOT EXISTS idx_entradas_fixed_template ON public.entradas_financeiras(fixed_template_id);
CREATE INDEX IF NOT EXISTS idx_entradas_is_fixed ON public.entradas_financeiras(is_fixed) WHERE is_fixed = true;

ALTER TABLE public.saidas_financeiras
  ADD COLUMN IF NOT EXISTS is_fixed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_day integer,
  ADD COLUMN IF NOT EXISTS fixed_template_id uuid REFERENCES public.saidas_financeiras(id) ON DELETE SET NULL;

ALTER TABLE public.saidas_financeiras
  DROP CONSTRAINT IF EXISTS saidas_financeiras_recurrence_day_check;
ALTER TABLE public.saidas_financeiras
  ADD CONSTRAINT saidas_financeiras_recurrence_day_check
  CHECK (recurrence_day IS NULL OR (recurrence_day BETWEEN 1 AND 31));

CREATE INDEX IF NOT EXISTS idx_saidas_fixed_template ON public.saidas_financeiras(fixed_template_id);
CREATE INDEX IF NOT EXISTS idx_saidas_is_fixed ON public.saidas_financeiras(is_fixed) WHERE is_fixed = true;
