CREATE OR REPLACE FUNCTION public.has_break_glass_access(_user_id uuid, _partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    _partner_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.superadmin_access_grants
      WHERE superadmin_user_id = _user_id
        AND partner_id = _partner_id
        AND ingetrokken_op IS NULL
        AND vervalt_op > now()
    );
$function$;