
-- 1) Add org_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 2) Backfill org_id in profiles from memberships (pick any one membership per user)
UPDATE public.profiles p
SET org_id = m.org_id
FROM (
  SELECT DISTINCT ON (user_id) user_id, org_id
  FROM public.memberships
  ORDER BY user_id, created_at NULLS LAST
) m
WHERE p.id = m.user_id
  AND p.org_id IS NULL;

CREATE INDEX IF NOT EXISTS profiles_org_id_idx ON public.profiles(org_id);

-- 3) Trigger to auto-fill agenda_itens.org_id from the logged-in user's profile
CREATE OR REPLACE FUNCTION public.set_agenda_itens_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.org_id IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_agenda_itens_org_id() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_agenda_itens_set_org_id ON public.agenda_itens;
CREATE TRIGGER trg_agenda_itens_set_org_id
BEFORE INSERT ON public.agenda_itens
FOR EACH ROW
EXECUTE FUNCTION public.set_agenda_itens_org_id();
