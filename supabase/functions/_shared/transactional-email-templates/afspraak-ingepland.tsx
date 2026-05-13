/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  titel?: string
  datum?: string
  tijd?: string
  locatie?: string
  type?: string
  klantNaam?: string
  notities?: string
  ingeplandDoor?: string
  agendaUrl?: string
}

const AfspraakIngeplandEmail = ({ titel, datum, tijd, locatie, type, klantNaam, notities, ingeplandDoor, agendaUrl }: Props) => {
  const url = agendaUrl ?? `${SITE_URL}/planning`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Nieuwe afspraak: {titel ?? ''}{datum ? ` op ${datum}` : ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nieuwe afspraak in je agenda</Heading>
          <Text style={text}>
            {ingeplandDoor ? `${ingeplandDoor} heeft` : 'Er is'} een afspraak voor je ingepland.
          </Text>
          <Section style={card}>
            {titel ? <Text style={row}><strong>Titel:</strong> {titel}</Text> : null}
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {type ? <Text style={row}><strong>Type:</strong> {type}</Text> : null}
            {datum ? <Text style={row}><strong>Datum:</strong> {datum}{tijd ? ` om ${tijd}` : ''}</Text> : null}
            {locatie ? <Text style={row}><strong>Locatie:</strong> {locatie}</Text> : null}
          </Section>
          {notities ? <Text style={quote}>{notities}</Text> : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open agenda</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AfspraakIngeplandEmail,
  subject: (d: Record<string, any>) =>
    `Nieuwe afspraak: ${d?.titel ?? ''}${d?.datum ? ` op ${d.datum}` : ''}`.trim(),
  displayName: 'Afspraak ingepland',
  previewData: { titel: 'TC | Ivo Van Rooy | Utrecht', klantNaam: 'Ivo Van Rooy', type: 'thuisbezoek', datum: '15-05-2026', tijd: '16:30', locatie: 'Utrecht', ingeplandDoor: 'Roshny' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const quote = { fontSize: '14px', color: '#222222', backgroundColor: '#fafafa', padding: '12px 14px', borderRadius: '10px', whiteSpace: 'pre-wrap' as const, margin: '8px 0 16px' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }