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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'trial-welkom': trialWelkom,
  'nieuwe-lead': nieuweLead,
  'offerte-geaccepteerd': offerteGeaccepteerd,
  'offerte-afgewezen': offerteAfgewezen,
  'offerte-nieuw-bericht': offerteNieuwBericht,
  'factuur-betaald': factuurBetaald,
  'factuur-vervalt-binnenkort': factuurVervaltBinnenkort,
  'trial-verloopt': trialVerloopt,
}