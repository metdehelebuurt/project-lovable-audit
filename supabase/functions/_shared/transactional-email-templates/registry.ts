/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as trialWelkom } from './trial-welkom.tsx'
import { template as nieuweLead } from './nieuwe-lead.tsx'
import { template as offerteGeaccepteerd } from './offerte-geaccepteerd.tsx'
import { template as offerteAfgewezen } from './offerte-afgewezen.tsx'
import { template as offerteNieuwBericht } from './offerte-nieuw-bericht.tsx'
import { template as factuurBetaald } from './factuur-betaald.tsx'
import { template as factuurVervaltBinnenkort } from './factuur-vervalt-binnenkort.tsx'
import { template as trialVerloopt } from './trial-verloopt.tsx'
import { template as schouwAfgerond } from './schouw-afgerond.tsx'
import { template as installatieIngepland } from './installatie-ingepland.tsx'
import { template as installatieGereed } from './installatie-gereed.tsx'
import { template as opleverOndertekend } from './oplever-ondertekend.tsx'
import { template as helpdeskEvent } from './helpdesk-event.tsx'
import { template as gebruikerWelkom } from './gebruiker-welkom.tsx'
import { template as afspraakIngepland } from './afspraak-ingepland.tsx'
import { template as afspraakGewijzigd } from './afspraak-gewijzigd.tsx'
import { template as afspraakGeannuleerd } from './afspraak-geannuleerd.tsx'
import { template as feedbackNieuwPlatform } from './feedback-nieuw-platform.tsx'
import { template as feedbackStatusUpdate } from './feedback-status-update.tsx'
import { template as notitieMention } from './notitie-mention.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'trial-welkom': trialWelkom,
  'nieuwe-lead': nieuweLead,
  'offerte-geaccepteerd': offerteGeaccepteerd,
  'offerte-afgewezen': offerteAfgewezen,
  'offerte-nieuw-bericht': offerteNieuwBericht,
  'factuur-betaald': factuurBetaald,
  'factuur-vervalt-binnenkort': factuurVervaltBinnenkort,
  'trial-verloopt': trialVerloopt,
  'schouw-afgerond': schouwAfgerond,
  'installatie-ingepland': installatieIngepland,
  'installatie-gereed': installatieGereed,
  'oplever-ondertekend': opleverOndertekend,
  'helpdesk-event': helpdeskEvent,
  'gebruiker-welkom': gebruikerWelkom,
  'afspraak-ingepland': afspraakIngepland,
  'afspraak-gewijzigd': afspraakGewijzigd,
  'afspraak-geannuleerd': afspraakGeannuleerd,
  'feedback-nieuw-platform': feedbackNieuwPlatform,
  'feedback-status-update': feedbackStatusUpdate,
  'notitie-mention': notitieMention,
}