/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface NieuweLeadProps {
  voornaam?: string
  achternaam?: string
  email?: string
  telefoon?: string
  bron?: string
  bericht?: string
  productNaam?: string
  leadUrl?: string
}

const NieuweLeadEmail = ({
  voornaam, achternaam, email, telefoon, bron, bericht, productNaam, leadUrl,
}: NieuweLeadProps) => {
  const naam = [voornaam, achternaam].filter(Boolean).join(' ') || 'Onbekend'
  const url = leadUrl ?? `${SITE_URL}/leads`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Nieuwe lead via je website: {naam}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nieuwe lead binnen</Heading>
          <Text style={text}>
            Er is via je website een nieuwe lead binnengekomen{bron ? ` (${bron})` : ''}.
          </Text>
          <Section style={card}>
            <Text style={row}><strong>Naam:</strong> {naam}</Text>
            {email ? <Text style={row}><strong>E-mail:</strong> {email}</Text> : null}
            {telefoon ? <Text style={row}><strong>Telefoon:</strong> {telefoon}</Text> : null}
            {productNaam ? <Text style={row}><strong>Product:</strong> {productNaam}</Text> : null}
            {bericht ? (<><Hr style={hr} /><Text style={row}><strong>Bericht:</strong></Text><Text style={text}>{bericht}</Text></>) : null}
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Bekijk lead</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NieuweLeadEmail,
  subject: (data: Record<string, any>) => {
    const naam = [data?.voornaam, data?.achternaam].filter(Boolean).join(' ') || 'onbekend'
    return `Nieuwe lead via website: ${naam}`
  },
  displayName: 'Nieuwe lead notificatie',
  previewData: {
    voornaam: 'Jan', achternaam: 'Jansen', email: 'jan@voorbeeld.nl',
    telefoon: '0612345678', bron: 'website_contactformulier',
    bericht: 'Graag offerte voor 10 panelen.',
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
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }