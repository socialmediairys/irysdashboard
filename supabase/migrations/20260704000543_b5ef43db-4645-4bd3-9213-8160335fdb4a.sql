CREATE TABLE public.google_calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  google_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_tokens TO authenticated;
GRANT ALL ON public.google_calendar_tokens TO service_role;

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tokens select" ON public.google_calendar_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tokens insert" ON public.google_calendar_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tokens update" ON public.google_calendar_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tokens delete" ON public.google_calendar_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_gct_updated_at BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();