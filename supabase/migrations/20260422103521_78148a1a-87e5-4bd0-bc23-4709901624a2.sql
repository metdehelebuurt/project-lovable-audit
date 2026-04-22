-- Sta partner_admin en superadmin toe om financiële documenten te verwijderen binnen hun eigen partner.
CREATE POLICY "Partner admins kunnen financiele documenten verwijderen"
ON public.financiele_documenten
FOR DELETE
TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    public.is_partner_admin_or_higher(auth.uid())
    AND partner_id = public.get_user_partner_id(auth.uid())
  )
);