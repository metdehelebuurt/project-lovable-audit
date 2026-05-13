/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  schouwnummer?: string
  klantNaam?: string
  uitvoerderNaam?: string
  schouwUrl?: string
}

const SchouwAfgerondEmail = ({ schouwnummer, klantNaam, uitvoerderNaam, schouwUrl }: Props) => {
  const url = schouwUrl ?? `${SITE_URL}/schouwen`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Schouw {schouwnummer ?? ''} afgerond</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Schouw afgerond</Heading>
          <Text style={text}>
            {uitvoerderNaam ?? 'De uitvoerder'} heeft schouw{schouwnummer ? ` ${schouwnummer}` : ''}
            {klantNaam ? ` bij ${klantNaam}` : ''} afgerond. Het rapport staat klaar in het dashboard.
          </Text>
          <Section style={card}>
            {schouwnummer ? <Text style={row}><strong>Schouwnummer:</strong> {schouwnummer}</Text> : null}
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {uitvoerderNaam ? <Text style={row}><strong>Uitvoerder:</strong> {uitvoerderNaam}</Text> : null}
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open schouw</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SchouwAfgerondEmail,
  subject: (d: Record<string, any>) => `Schouw ${d?.schouwnummer ?? ''} afgerond`.trim(),
  displayName: 'Schouw afgerond',
  previewData: { schouwnummer: 'SCH-2025-0042', klantNaam: 'Jan Jansen', uitvoerderNaam: 'Peter de Vries' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }