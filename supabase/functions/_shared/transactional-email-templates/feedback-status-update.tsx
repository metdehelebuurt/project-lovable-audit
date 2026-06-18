/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://app.mijnhuis.nu'

const STATUS_LABEL: Record<string, string> = {
  nieuw: 'Nieuw',
  in_behandeling: 'In behandeling',
  gepland: 'Gepland',
  afgerond: 'Afgerond',
  afgewezen: 'Afgewezen',
}

interface Props {
  titel?: string
  type?: 'feedback' | 'functieverzoek'
  oudeStatus?: string
  nieuweStatus?: string
  adminReactie?: string
  feedbackUrl?: string
  indienerNaam?: string
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const Email = ({ titel, type, oudeStatus, nieuweStatus, adminReactie, feedbackUrl, indienerNaam }: Props) => {
  const url = feedbackUrl ?? `${SITE_URL}/feedback`
  const reactie = adminReactie ? stripHtml(adminReactie) : ''
  const label = STATUS_LABEL[nieuweStatus ?? ''] ?? nieuweStatus ?? '—'
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Status van je {type === 'functieverzoek' ? 'verzoek' : 'feedback'} is bijgewerkt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Update op je {type === 'functieverzoek' ? 'functieverzoek' : 'feedback'}</Heading>
          <Text style={text}>
            {indienerNaam ? `Hoi ${indienerNaam},` : 'Hoi,'} we hebben een update voor je over je melding op {SITE_NAME}.
          </Text>
          <Section style={card}>
            {titel ? <Text style={row}><strong>Titel:</strong> {titel}</Text> : null}
            <Text style={row}><strong>Nieuwe status:</strong> {label}</Text>
            {oudeStatus && oudeStatus !== nieuweStatus ? (
              <Text style={row}><strong>Oude status:</strong> {STATUS_LABEL[oudeStatus] ?? oudeStatus}</Text>
            ) : null}
          </Section>
          {reactie ? (
            <>
              <Text style={text}><strong>Reactie van het team:</strong></Text>
              <Text style={quote}>{reactie}</Text>
            </>
          ) : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk in het platform</Button>
          </Section>
          <Text style={footer}>Bedankt voor je input — we gebruiken het om {SITE_NAME} beter te maken.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const label = STATUS_LABEL[d?.nieuweStatus ?? ''] ?? d?.nieuweStatus ?? 'bijgewerkt'
    return `Update: "${d?.titel ?? ''}" is nu ${label}`
  },
  displayName: 'Feedback - statusupdate (indiener)',
  previewData: {
    titel: 'Knop werkt niet op mobiel', type: 'feedback',
    oudeStatus: 'nieuw', nieuweStatus: 'in_behandeling',
    adminReactie: 'Bedankt voor je melding — we pakken dit deze week op.',
    indienerNaam: 'Jan',
  },
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