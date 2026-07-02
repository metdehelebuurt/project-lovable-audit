
CREATE POLICY "Installateur ziet gekoppelde schouwen via installatie"
ON public.schouwen
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'installateur'::app_role
  AND (
    EXISTS (SELECT 1 FROM public.installaties i WHERE i.schouw_id = schouwen.id AND i.installateur_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.installaties i
      JOIN public.opdrachten o ON o.id = i.opdracht_id
      WHERE o.schouw_id = schouwen.id AND i.installateur_id = auth.uid()
    )
  )
);
