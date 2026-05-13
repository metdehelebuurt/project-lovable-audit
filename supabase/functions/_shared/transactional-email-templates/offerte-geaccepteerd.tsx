/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  klantNaam?: string
  offertenummer?: string
  totaalBedrag?: string
  offerteUrl?: string
}

const OfferteGeaccepteerdEmail = ({ klantNaam, offertenummer, totaalBedrag, offerteUrl }: Props) => {
  const url = offerteUrl ?? `${SITE_URL}/offertes`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Offerte {offertenummer ?? ''} geaccepteerd door {klantNaam ?? 'klant'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Offerte geaccepteerd</Heading>
          <Text style={text}>
            Goed nieuws! {klantNaam ?? 'De klant'} heeft offerte
            {offertenummer ? ` ${offertenummer}` : ''} digitaal geaccepteerd.
          </Text>
          <Section style={card}>
            {offertenummer ? <Text style={row}><strong>Offertenummer:</strong> {offertenummer}</Text> : null}
            {klantNaam ? <Text style={row}><strong>Klant:</strong> {klantNaam}</Text> : null}
            {totaalBedrag ? <Text style={row}><strong>Totaalbedrag:</strong> {totaalBedrag}</Text> : null}
          </Section>
          <Text style={text}>
            De opdracht is automatisch aangemaakt. Plan een schouw of installatie in vanuit het dashboard.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk in dashboard</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OfferteGeaccepteerdEmail,
  subject: (data: Record<string, any>) =>
    `Offerte ${data?.offertenummer ?? ''} geaccepteerd${data?.klantNaam ? ` door ${data.klantNaam}` : ''}`.trim(),
  displayName: 'Offerte geaccepteerd',
  previewData: {
    klantNaam: 'Jan Jansen',
    offertenummer: 'OF-251201-0001',
    totaalBedrag: '€ 8.450,00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '16px 0 0', lineHeight: '1.5' }