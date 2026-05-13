/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  partnerNaam?: string
  daysUntil?: number
  verloopDatum?: string
  planNaam?: string
}

const TrialVerlooptEmail = ({ partnerNaam, daysUntil, verloopDatum, planNaam }: Props) => {
  const url = `${SITE_URL}/instellingen/abonnement`
  const dagtekst =
    daysUntil === 1 ? 'morgen' :
    daysUntil ? `over ${daysUntil} dagen` : 'binnenkort'
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Je proefperiode verloopt {dagtekst}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Je proefperiode verloopt {dagtekst}</Heading>
          <Text style={text}>
            {partnerNaam ? `Hoi ${partnerNaam},` : 'Hoi,'}
          </Text>
          <Text style={text}>
            Je gratis proefperiode op {SITE_NAME} loopt {dagtekst} af
            {verloopDatum ? ` (${verloopDatum})` : ''}. Activeer een betaald abonnement om
            zonder onderbreking gebruik te blijven maken van leads, offertes, planning en het klantportaal.
          </Text>
          {planNaam ? (
            <Section style={card}>
              <Text style={row}><strong>Huidig plan:</strong> {planNaam}</Text>
              {verloopDatum ? <Text style={row}><strong>Verloopt op:</strong> {verloopDatum}</Text> : null}
            </Section>
          ) : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Abonnement activeren</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TrialVerlooptEmail,
  subject: (data: Record<string, any>) => {
    const d = data?.daysUntil
    if (d === 1) return 'Je proefperiode verloopt morgen'
    if (typeof d === 'number') return `Je proefperiode verloopt over ${d} dagen`
    return 'Je proefperiode verloopt binnenkort'
  },
  displayName: 'Trial verloopt herinnering',
  previewData: { partnerNaam: 'Cenora', daysUntil: 3, verloopDatum: '15-12-2025', planNaam: 'Starter' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#fff8eb', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }