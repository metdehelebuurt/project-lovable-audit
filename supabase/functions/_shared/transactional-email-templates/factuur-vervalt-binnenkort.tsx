/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  documentnummer?: string
  klantNaam?: string
  totaalBedrag?: string
  vervaldatum?: string
  daysUntil?: number
  factuurUrl?: string
}

const FactuurVervaltBinnenkortEmail = ({
  documentnummer, klantNaam, totaalBedrag, vervaldatum, daysUntil, factuurUrl,
}: Props) => {
  const url = factuurUrl ?? `${SITE_URL}/financieel`
  const dagtekst = daysUntil === 0 ? 'vandaag' : daysUntil === 1 ? 'morgen' : `over ${daysUntil ?? '?'} dagen`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Factuur {documentnummer ?? ''} vervalt {dagtekst}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Factuur vervalt {dagtekst}</Heading>
          <Text style={text}>
            Een openstaande factuur{documentnummer ? ` (${documentnummer})` : ''} vervalt {dagtekst}.
          </Text>
          <Section style={card}>
            {documentnummer ? <Text style={row}><strong>Factuur:</strong> {documentnummer}</Text> : null}
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {totaalBedrag ? <Text style={row}><strong>Bedrag:</strong> {totaalBedrag}</Text> : null}
            {vervaldatum ? <Text style={row}><strong>Vervaldatum:</strong> {vervaldatum}</Text> : null}
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk factuur</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FactuurVervaltBinnenkortEmail,
  subject: (data: Record<string, any>) => `Factuur ${data?.documentnummer ?? ''} vervalt binnenkort`.trim(),
  displayName: 'Factuur vervalt binnenkort',
  previewData: {
    documentnummer: 'VF-2025-0042', klantNaam: 'Jan Jansen',
    totaalBedrag: '€ 8.450,00', vervaldatum: '20-12-2025', daysUntil: 3,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#fff8eb', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }