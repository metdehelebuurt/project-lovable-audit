/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'

interface Props {
  klantNaam?: string
  type?: 'terugbel' | 'demo'
  gepland?: string
  collegaNaam?: string
  collegaEmail?: string
  notitie?: string
}

const formatNl = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch { return iso }
}

const AfspraakKlantEmail = ({ klantNaam, type, gepland, collegaNaam, collegaEmail, notitie }: Props) => {
  const isDemo = type === 'demo'
  const titel = isDemo ? 'Bevestiging demo-afspraak' : 'Bevestiging terugbelafspraak'
  const intro = isDemo
    ? 'Bedankt voor je interesse. We hebben de demo voor je ingepland.'
    : 'Bedankt voor je interesse. We hebben een terugbelafspraak voor je ingepland.'
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{titel} — {formatNl(gepland)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{titel}</Heading>
          <Text style={text}>{klantNaam ? `Beste ${klantNaam},` : 'Beste,'}</Text>
          <Text style={text}>{intro}</Text>
          <Section style={card}>
            <Text style={row}><strong>Wanneer:</strong> {formatNl(gepland)} (Nederlandse tijd)</Text>
            {collegaNaam ? <Text style={row}><strong>Wie neemt contact op:</strong> {collegaNaam}</Text> : null}
            {collegaEmail ? <Text style={row}><strong>E-mail:</strong> {collegaEmail}</Text> : null}
            <Text style={row}><strong>Type:</strong> {isDemo ? 'Demo' : 'Telefonische afspraak'}</Text>
          </Section>
          {notitie ? <Text style={quote}>{notitie}</Text> : null}
          <Text style={text}>
            Past het moment toch niet? Stuur dan een reactie op deze e-mail, dan plannen we het opnieuw in.
          </Text>
          <Text style={footer}>— Team {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AfspraakKlantEmail,
  subject: (d: Record<string, any>) =>
    d?.type === 'demo' ? 'Bevestiging demo-afspraak' : 'Bevestiging terugbelafspraak',
  displayName: 'Affiliate — afspraak bevestiging (klant)',
  previewData: {
    klantNaam: 'Jan de Vries',
    type: 'demo',
    gepland: new Date(Date.now() + 86400000).toISOString(),
    collegaNaam: 'Roshny Patel',
    collegaEmail: 'roshny@mijnhuis.nu',
    notitie: 'We laten je in de demo zien hoe de schouwmodule werkt.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const quote = { fontSize: '14px', color: '#222222', backgroundColor: '#fafafa', padding: '12px 14px', borderRadius: '10px', whiteSpace: 'pre-wrap' as const, margin: '8px 0 16px' }
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }