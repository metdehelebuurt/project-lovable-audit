/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'

interface Props {
  collegaNaam?: string
  klantNaam?: string
  klantEmail?: string
  klantTelefoon?: string
  bedrijfsnaam?: string
  type?: 'terugbel' | 'demo'
  gepland?: string
  notitie?: string
  affiliateNaam?: string
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

const AfspraakCollegaEmail = ({ collegaNaam, klantNaam, klantEmail, klantTelefoon, bedrijfsnaam, type, gepland, notitie, affiliateNaam }: Props) => {
  const isDemo = type === 'demo'
  const titel = isDemo ? 'Nieuwe demo voor jou' : 'Nieuwe terugbelafspraak voor jou'
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{titel} — {formatNl(gepland)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{titel}</Heading>
          <Text style={text}>{collegaNaam ? `Hoi ${collegaNaam},` : 'Hoi,'}</Text>
          <Text style={text}>
            {affiliateNaam ? `${affiliateNaam} heeft` : 'Er is'} {isDemo ? 'een demo' : 'een terugbelafspraak'} voor je ingepland.
          </Text>
          <Section style={card}>
            <Text style={row}><strong>Wanneer:</strong> {formatNl(gepland)} (Nederlandse tijd)</Text>
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {bedrijfsnaam ? <Text style={row}><strong>Bedrijf:</strong> {bedrijfsnaam}</Text> : null}
            {klantEmail ? <Text style={row}><strong>E-mail:</strong> {klantEmail}</Text> : null}
            {klantTelefoon ? <Text style={row}><strong>Telefoon:</strong> {klantTelefoon}</Text> : null}
            <Text style={row}><strong>Type:</strong> {isDemo ? 'Demo' : 'Telefonische afspraak'}</Text>
          </Section>
          {notitie ? <Text style={quote}>{notitie}</Text> : null}
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AfspraakCollegaEmail,
  subject: (d: Record<string, any>) =>
    d?.type === 'demo' ? 'Nieuwe demo voor jou' : 'Nieuwe terugbelafspraak voor jou',
  displayName: 'Affiliate — afspraak melding (collega)',
  previewData: {
    collegaNaam: 'Roshny',
    klantNaam: 'Jan de Vries',
    klantEmail: 'jan@voorbeeld.nl',
    klantTelefoon: '0612345678',
    bedrijfsnaam: 'De Vries Installaties',
    type: 'terugbel',
    gepland: new Date(Date.now() + 86400000).toISOString(),
    notitie: 'Klant wil offerte bespreken.',
    affiliateNaam: 'Bas',
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