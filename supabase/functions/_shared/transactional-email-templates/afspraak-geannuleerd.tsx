/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'

interface Props {
  titel?: string
  datum?: string
  tijd?: string
  klantNaam?: string
  geannuleerdDoor?: string
  reden?: string
}

const AfspraakGeannuleerdEmail = ({ titel, datum, tijd, klantNaam, geannuleerdDoor, reden }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Afspraak geannuleerd: {titel ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Afspraak geannuleerd</Heading>
        <Text style={text}>
          {geannuleerdDoor ? `${geannuleerdDoor} heeft` : 'Er is'} een afspraak in je agenda geannuleerd.
        </Text>
        <Section style={card}>
          {titel ? <Text style={row}><strong>Titel:</strong> {titel}</Text> : null}
          {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
          {datum ? <Text style={row}><strong>Was gepland op:</strong> {datum}{tijd ? ` om ${tijd}` : ''}</Text> : null}
          {reden ? <Text style={row}><strong>Reden:</strong> {reden}</Text> : null}
        </Section>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AfspraakGeannuleerdEmail,
  subject: (d: Record<string, any>) => `Afspraak geannuleerd: ${d?.titel ?? ''}`.trim(),
  displayName: 'Afspraak geannuleerd',
  previewData: { titel: 'TC | Ivo Van Rooy | Utrecht', klantNaam: 'Ivo Van Rooy', datum: '15-05-2026', tijd: '16:30', geannuleerdDoor: 'Roshny' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#fef2f2', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }