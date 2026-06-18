/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'

interface Props {
  ontvangerNaam?: string
  schouwNummer?: string
  consumentNaam?: string
  url?: string
}

const Email = ({ ontvangerNaam, schouwNummer, consumentNaam, url }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Consument heeft foto's aangeleverd voor de schouw</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Foto's aangeleverd door consument</Heading>
        <Text style={text}>
          {ontvangerNaam ? `Hoi ${ontvangerNaam},` : 'Hoi,'} {consumentNaam || 'de consument'} heeft de foto's voor schouw{' '}
          <strong>{schouwNummer ?? ''}</strong> aangeleverd via de self-service link.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Schouwnummer:</strong> {schouwNummer ?? '—'}</Text>
          {consumentNaam ? <Text style={row}><strong>Consument:</strong> {consumentNaam}</Text> : null}
        </Section>
        {url ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk in {SITE_NAME}</Button>
          </Section>
        ) : null}
        <Text style={footer}>Je ontvangt deze e-mail omdat je adviseur bent op deze schouw.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Foto's aangeleverd voor schouw ${d?.schouwNummer ?? ''}`.trim(),
  displayName: 'Consument - schouwfoto\'s aangeleverd',
  previewData: {
    ontvangerNaam: 'Anouk', schouwNummer: 'SCH-2026-0123', consumentNaam: 'Familie De Vries',
    url: 'https://app.mijnhuis.nu/schouwen/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }