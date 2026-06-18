
-- 1) email_accounts: maak partner_id optioneel
ALTER TABLE public.email_accounts ALTER COLUMN partner_id DROP NOT NULL;

-- 2) email_berichten: maak partner_id optioneel en voeg user_id + affiliate_lead_id toe
ALTER TABLE public.email_berichten ALTER COLUMN partner_id DROP NOT NULL;
ALTER TABLE public.email_berichten ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.email_berichten ADD COLUMN IF NOT EXISTS affiliate_lead_id uuid
  REFERENCES public.affiliate_leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_berichten_user ON public.email_berichten(user_id);
CREATE INDEX IF NOT EXISTS idx_email_berichten_affiliate_lead ON public.email_berichten(affiliate_lead_id);

-- 3) RLS voor email_accounts: ook eigenaar (user_id) toegang geven
DROP POLICY IF EXISTS "Users can view own partner email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can update own partner email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can insert own partner email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can delete own partner email accounts" ON public.email_accounts;

CREATE POLICY "Email accounts: select own"
  ON public.email_accounts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Email accounts: insert own"
  ON public.email_accounts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Email accounts: update own"
  ON public.email_accounts FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Email accounts: delete own"
  ON public.email_accounts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

-- 4) RLS voor email_berichten: idem
DROP POLICY IF EXISTS "Users can view own partner email messages" ON public.email_berichten;
DROP POLICY IF EXISTS "Users can insert own partner email messages" ON public.email_berichten;

CREATE POLICY "Email berichten: select own"
  ON public.email_berichten FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Email berichten: insert own"
  ON public.email_berichten FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Email berichten: update own"
  ON public.email_berichten FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (partner_id IS NOT NULL AND partner_id IN (SELECT partner_id FROM public.users WHERE id = auth.uid()))
  );
