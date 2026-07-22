
REVOKE SELECT (access_token), UPDATE (access_token), INSERT (access_token)
  ON public.social_accounts FROM authenticated;
REVOKE SELECT (access_token), UPDATE (access_token), INSERT (access_token)
  ON public.social_accounts FROM anon;
