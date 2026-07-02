## Bug

`useAffiliateLeadSignals` wordt op meerdere plekken tegelijk gebruikt (o.a. `PipelineKaart`, pipeline-header). Elke instantie roept `supabase.channel("lead-signals:<userId>")` met dezelfde topic-naam aan. Supabase realtime v2 hergebruikt dan een bestaand channel-object — waarop `.subscribe()` al is uitgevoerd — en `.on("postgres_changes", …)` gooit dan:

`cannot add postgres_changes callbacks for realtime:lead-signals:<userId> after subscribe()`

## Fix

Één keer subscriben per user, ongeacht hoeveel componenten de hook gebruiken. Concreet in `src/hooks/affiliate/useLeadSignals.ts`:

- Unieke topic per aanroep: channelnaam `lead-signals:<userId>:<useId()>` zodat er geen collisie ontstaat tussen instanties. Dit is de kleinste, veiligste ingreep en werkt ook in React StrictMode (mount → unmount → mount).
- `useEffect` blijft de `on(...).subscribe()`-volgorde bewaren en ruimt netjes op met `supabase.removeChannel`.

Geen andere gedragswijzigingen; realtime-invalidatie blijft identiek.

## Wijzigingen

- `src/hooks/affiliate/useLeadSignals.ts`: `useId()` importeren, kanaalnaam maken met dat id.
