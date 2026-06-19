export type ZoekModus = 'search' | 'scrape'

export interface ExtractedLead {
  bedrijfsnaam: string
  website: string | null
  email: string | null
  telefoon: string | null
  plaats: string | null
  branche: string | null
  fragment: string | null
  bron_url: string | null
}

export interface ZoekFormState {
  modus: ZoekModus
  branches: string[]
  regio: string
  query: string
  url: string
  limit: number
  bestemming: 'pool' | 'mine'
}

export const BRANCHE_OPTIES = [
  'zonnepanelen',
  'thuisbatterijen',
  'laadpalen',
  'isolatie',
  'warmtepompen',
] as const