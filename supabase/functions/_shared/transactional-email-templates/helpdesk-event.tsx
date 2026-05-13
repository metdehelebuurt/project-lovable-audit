/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

type EventType =
  | 'nieuw_ticket' | 'toewijzing' | 'klant_reactie' | 'escalatie'
  | 'oplossing' | 'storing' | 'monteur_ticket'

const LABELS: Record<EventType, { titel: string; intro: string }> = {
  nieuw_ticket:   { titel: 'Nieuw ticket',           intro: 'Er is een nieuw ticket aangemaakt.' },
  toewijzing:     { titel: 'Ticket toegewezen',      intro: 'Een ticket is aan je toegewezen.' },
  klant_reactie:  { titel: 'Klantreactie op ticket', intro: 'Er is een klantreactie geplaatst op een ticket.' },
  escalatie:      { titel: '🚨 Ticket geëscaleerd',  intro: 'Een ticket is geëscaleerd door SLA-overschrijding.' },
  oplossing:      { titel: 'Ticket opgelost',        intro: 'Een ticket is gemarkeerd als opgelost.' },
  storing:        { titel: '🚨 STORING gemeld',      intro: 'Er is een storing gemeld die direct aandacht vraagt.' },
  monteur_ticket: { titel: 'Monteur-ticket',         intro: 'Een monteur heeft een ticket aangemaakt op een installatie die jij beheert.' },
}

interface Props {
  event?: EventType
  ticketnummer?: string
  titel?: string
  prioriteit?: string
  status?: string
  type?: string
  omschrijving?: string
  slaDeadline?: string
  ticketUrl?: string
}

const HelpdeskEventEmail = ({ event, ticketnummer, titel, prioriteit, status, type, omschrijving, slaDeadline, ticketUrl }: Props) => {
  const meta = LABELS[event ?? 'nieuw_ticket']
  const url = ticketUrl ?? `${SITE_URL}/helpdesk`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{meta.titel}: {ticketnummer ?? ''} — {titel ?? ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{meta.titel}</Heading>
          <Text style={text}>{meta.intro}</Text>
          <Section style={card}>
            {ticketnummer ? <Text style={row}><strong>Ticket:</strong> {ticketnummer}</Text> : null}
            {titel ? <Text style={row}><strong>Titel:</strong> {titel}</Text> : null}
            {type ? <Text style={row}><strong>Type:</strong> {type}</Text> : null}
            {prioriteit ? <Text style={row}><strong>Prioriteit:</strong> {prioriteit}</Text> : null}
            {status ? <Text style={row}><strong>Status:</strong> {status}</Text> : null}
            {slaDeadline ? <Text style={row}><strong>SLA-deadline:</strong> {slaDeadline}</Text> : null}
          </Section>
          {omschrijving ? <Text style={quote}>{omschrijving}</Text> : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open ticket</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME} helpdesk</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: HelpdeskEventEmail,
  subject: (d: Record<string, any>) => {
    const meta = LABELS[(d?.event as EventType) ?? 'nieuw_ticket']
    return `${meta.titel}: ${d?.ticketnummer ?? ''} — ${d?.titel ?? ''}`.trim()
  },
  displayName: 'Helpdesk event',
  previewData: { event: 'nieuw_ticket', ticketnummer: 'TCK-2025-0123', titel: 'Omvormer geeft foutcode', prioriteit: 'hoog', status: 'open', type: 'storing' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const quote = { fontSize: '14px', color: '#222222', backgroundColor: '#f6f6f9', padding: '12px 14px', borderRadius: '10px', whiteSpace: 'pre-wrap' as const, margin: '8px 0 16px' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }