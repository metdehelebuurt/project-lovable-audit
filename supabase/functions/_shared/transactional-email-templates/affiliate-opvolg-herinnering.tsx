/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { affiliateNaam?: string; titel?: string; notitie?: string; due_op?: string; klantNaam?: string; klantTelefoon?: string; klantEmail?: string; prioriteit?: string }

const fmt = (iso?: string) => {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) } catch { return iso }
}

const Email = ({ affiliateNaam, titel, notitie, due_op, klantNaam, klantTelefoon, klantEmail, prioriteit }: Props) => (
  <Html lang="nl" dir="ltr"><Head /><Preview>Herinnering: {titel}</Preview>
    <Body style={main}><Container style={container}>
      <Heading style={h1}>Op je lijstje voor binnenkort</Heading>
      <Text style={text}>{affiliateNaam ? `Hoi ${affiliateNaam},` : 'Hoi,'}</Text>
      <Text style={text}>Deze opvolg-taak staat klaar:</Text>
      <Section style={card}>
        <Text style={row}><strong>{titel}</strong></Text>
        <Text style={row}>Wanneer: {fmt(due_op)} (Nederlandse tijd)</Text>
        {prioriteit ? <Text style={row}>Prioriteit: {prioriteit}</Text> : null}
        {klantNaam ? <Text style={row}>Klant: {klantNaam}</Text> : null}
        {klantTelefoon ? <Text style={row}>Telefoon: {klantTelefoon}</Text> : null}
        {klantEmail ? <Text style={row}>E-mail: {klantEmail}</Text> : null}
      </Section>
      {notitie ? <Text style={quote}>{notitie}</Text> : null}
      <Text style={footer}>— Mijnhuis.nu</Text>
    </Container></Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Herinnering: ${d?.titel ?? 'opvolg-taak'}`,
  displayName: 'Affiliate — opvolg-herinnering',
  previewData: { affiliateNaam: 'Bas', titel: 'Bel Jan over offerte', due_op: new Date(Date.now() + 3600000).toISOString(), klantNaam: 'Jan de Vries', klantTelefoon: '0612345678', prioriteit: 'normaal' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const quote = { fontSize: '14px', color: '#222222', backgroundColor: '#fafafa', padding: '12px 14px', borderRadius: '10px', whiteSpace: 'pre-wrap' as const, margin: '8px 0 16px' }
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0' }