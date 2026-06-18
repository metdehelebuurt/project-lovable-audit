/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { affiliateNaam?: string; klantNaam?: string; dagen?: number; einddatum?: string }

const fmtDatum = (iso?: string) => {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) } catch { return iso }
}

const Email = ({ affiliateNaam, klantNaam, dagen, einddatum }: Props) => {
  const tekst = dagen === 0
    ? `De trial van ${klantNaam} loopt vandaag af.`
    : `De trial van ${klantNaam} loopt over ${dagen} dagen af (${fmtDatum(einddatum)}).`
  return (
    <Html lang="nl" dir="ltr"><Head /><Preview>{tekst}</Preview>
      <Body style={main}><Container style={container}>
        <Heading style={h1}>Trial-opvolging</Heading>
        <Text style={text}>{affiliateNaam ? `Hoi ${affiliateNaam},` : 'Hoi,'}</Text>
        <Text style={text}>{tekst} Dit is hét moment om contact op te nemen en de conversie naar betaald te begeleiden.</Text>
        <Section style={card}>
          <Text style={row}><strong>Klant:</strong> {klantNaam}</Text>
          <Text style={row}><strong>Trial einde:</strong> {fmtDatum(einddatum)} (Nederlandse tijd)</Text>
        </Section>
        <Text style={text}>Tip: vraag of de implementatie soepel verloopt en welke vragen er nog leven.</Text>
        <Text style={footer}>— Mijnhuis.nu</Text>
      </Container></Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => d?.dagen === 0
    ? `Trial van ${d?.klantNaam ?? 'klant'} loopt vandaag af`
    : `Trial van ${d?.klantNaam ?? 'klant'} loopt over ${d?.dagen ?? '?'} dagen af`,
  displayName: 'Affiliate — trial opvolging',
  previewData: { affiliateNaam: 'Bas', klantNaam: 'De Vries Installaties', dagen: 3, einddatum: new Date(Date.now() + 3*86400000).toISOString() },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0' }