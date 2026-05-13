/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  afzenderNaam?: string
  offertenummer?: string
  bericht?: string
  offerteUrl?: string
}

const OfferteNieuwBerichtEmail = ({ afzenderNaam, offertenummer, bericht, offerteUrl }: Props) => {
  const url = offerteUrl ?? `${SITE_URL}/offertes`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Nieuw bericht van {afzenderNaam ?? 'klant'} op offerte {offertenummer ?? ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nieuw bericht op offerte</Heading>
          <Text style={text}>
            {afzenderNaam ?? 'Een klant'} heeft een bericht achtergelaten op offerte
            {offertenummer ? ` ${offertenummer}` : ''}.
          </Text>
          {bericht ? (
            <Section style={card}>
              <Text style={quote}>“{bericht}”</Text>
            </Section>
          ) : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open offerte</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OfferteNieuwBerichtEmail,
  subject: (data: Record<string, any>) =>
    `Nieuw bericht van ${data?.afzenderNaam ?? 'klant'} — offerte ${data?.offertenummer ?? ''}`.trim(),
  displayName: 'Nieuw bericht op offerte',
  previewData: {
    afzenderNaam: 'Jan Jansen',
    offertenummer: 'OF-251201-0001',
    bericht: 'Klopt het dat de optionele zonneboiler nog niet is meegenomen in de prijs?',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const quote = { fontSize: '14px', color: '#222222', margin: 0, fontStyle: 'italic' as const, lineHeight: '1.6' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }