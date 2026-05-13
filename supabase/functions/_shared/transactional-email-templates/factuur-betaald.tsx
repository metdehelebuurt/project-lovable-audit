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
  betaaldOp?: string
  factuurUrl?: string
}

const FactuurBetaaldEmail = ({ documentnummer, klantNaam, totaalBedrag, betaaldOp, factuurUrl }: Props) => {
  const url = factuurUrl ?? `${SITE_URL}/financieel`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Factuur {documentnummer ?? ''} betaald</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✓ Factuur betaald</Heading>
          <Text style={text}>
            Factuur{documentnummer ? ` ${documentnummer}` : ''} is gemarkeerd als betaald.
          </Text>
          <Section style={card}>
            {documentnummer ? <Text style={row}><strong>Factuur:</strong> {documentnummer}</Text> : null}
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {totaalBedrag ? <Text style={row}><strong>Bedrag:</strong> {totaalBedrag}</Text> : null}
            {betaaldOp ? <Text style={row}><strong>Betaald op:</strong> {betaaldOp}</Text> : null}
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open in dashboard</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FactuurBetaaldEmail,
  subject: (data: Record<string, any>) => `Factuur ${data?.documentnummer ?? ''} is betaald`.trim(),
  displayName: 'Factuur betaald',
  previewData: {
    documentnummer: 'VF-2025-0042',
    klantNaam: 'Jan Jansen',
    totaalBedrag: '€ 8.450,00',
    betaaldOp: '12-12-2025',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f1faf3', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }