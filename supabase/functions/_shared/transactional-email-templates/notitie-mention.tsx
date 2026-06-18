/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'

interface Props {
  ontvangerNaam?: string
  senderNaam?: string
  resourceLabel?: string
  resourceTitel?: string
  snippet?: string
  url?: string
}

const Email = ({ ontvangerNaam, senderNaam, resourceLabel, resourceTitel, snippet, url }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{senderNaam ?? 'Een collega'} heeft je getagd in een notitie</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Je bent getagd in een notitie</Heading>
        <Text style={text}>
          {ontvangerNaam ? `Hoi ${ontvangerNaam},` : 'Hoi,'} {senderNaam ?? 'een collega'} heeft je genoemd in een notitie{resourceLabel ? ` bij ${resourceLabel.toLowerCase()}` : ''}{resourceTitel ? ` "${resourceTitel}"` : ''} op {SITE_NAME}.
        </Text>
        {snippet ? (
          <Section style={card}>
            <Text style={quote}>{snippet}</Text>
          </Section>
        ) : null}
        {url ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk in het platform</Button>
          </Section>
        ) : null}
        <Text style={footer}>Je ontvangt deze e-mail omdat een collega je tagde in een notitie op {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d?.senderNaam ?? 'Een collega'} tagde je in een notitie`,
  displayName: 'Notitie - mention',
  previewData: {
    ontvangerNaam: 'Jan',
    senderNaam: 'Anouk',
    resourceLabel: 'Lead',
    resourceTitel: 'De Vries — Zonnepanelen',
    snippet: 'Kun je hier even naar kijken? Klant wacht op offerte.',
    url: 'https://app.mijnhuis.nu/leads/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const quote = { fontSize: '14px', color: '#222222', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }