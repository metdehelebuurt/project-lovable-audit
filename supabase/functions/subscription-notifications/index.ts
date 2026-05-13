const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.0';
import {
  getPartnerNotifyRecipients,
  sendTransactionalBatch,
} from '../_shared/partner-notify-recipients.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 1. Check trials die binnenkort verlopen (7 en 3 dagen)
    const { data: abos } = await supabase
      .from('abonnementen')
      .select('*, partners(naam), abonnement_plannen(naam)')
      .in('status', ['trial', 'actief']);

    if (!abos) {
      return new Response(JSON.stringify({ message: 'Geen abonnementen' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notifications: any[] = [];

    for (const abo of abos) {
      if (!abo.verloop_datum) continue;
      const verloopDate = new Date(abo.verloop_datum);
      const daysUntil = Math.ceil((verloopDate.getTime() - now.getTime()) / 86400000);

      if ([7, 3, 1].includes(daysUntil)) {
        // Get partner admin user
        const { data: adminUsers } = await supabase
          .from('users')
          .select('id')
          .eq('partner_id', abo.partner_id)
          .eq('rol', 'partner_admin')
          .limit(1);

        if (adminUsers && adminUsers.length > 0) {
          notifications.push({
            user_id: adminUsers[0].id,
            titel: daysUntil === 1 ? 'Abonnement verloopt morgen!' : `Abonnement verloopt over ${daysUntil} dagen`,
            bericht: `Uw ${abo.status === 'trial' ? 'trial' : 'abonnement'} (${(abo as any).abonnement_plannen?.naam ?? abo.plan}) verloopt op ${abo.verloop_datum}. Neem actie om uw account actief te houden.`,
            type: 'abonnement_verloop',
            entity_type: 'abonnementen',
            entity_id: abo.id,
          });
        }

        // Verstuur e-mail aan partner_admin + backoffice (alleen voor trials)
        if (abo.status === 'trial') {
          try {
            const recipients = await getPartnerNotifyRecipients(supabase, abo.partner_id);
            const verloopFmt = new Date(abo.verloop_datum).toLocaleDateString('nl-NL');
            await sendTransactionalBatch(
              'trial-verloopt',
              recipients,
              `trial-verloopt-${abo.id}-${daysUntil}`,
              {
                partnerNaam: (abo as any).partners?.naam,
                daysUntil,
                verloopDatum: verloopFmt,
                planNaam: (abo as any).abonnement_plannen?.naam ?? abo.plan,
              },
            );
          } catch (mailErr) {
            console.warn('Trial-verloopt e-mail mislukt:', mailErr);
          }
        }

        // Admin notification
        const { data: superadmins } = await supabase
          .from('users')
          .select('id')
          .eq('rol', 'superadmin');

        for (const admin of superadmins ?? []) {
          notifications.push({
            user_id: admin.id,
            titel: `${(abo as any).partners?.naam}: ${abo.status} verloopt over ${daysUntil} dagen`,
            bericht: `Partner ${(abo as any).partners?.naam} heeft een ${abo.status} dat verloopt op ${abo.verloop_datum}.`,
            type: 'admin_abonnement_verloop',
            entity_type: 'abonnementen',
            entity_id: abo.id,
          });
        }
      }

      // 2. Check verlopen abonnementen en markeer
      if (daysUntil < 0 && abo.status !== 'verlopen') {
        await supabase.from('abonnementen').update({ status: 'verlopen' }).eq('id', abo.id);
      }
    }

    // Insert notificaties
    if (notifications.length > 0) {
      await supabase.from('notificaties').insert(notifications);
    }

    return new Response(JSON.stringify({
      message: `Verwerkt: ${abos.length} abonnementen, ${notifications.length} notificaties`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
