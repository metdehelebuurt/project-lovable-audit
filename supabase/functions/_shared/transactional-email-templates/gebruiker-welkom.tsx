/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  voornaam?: string
  email?: string
  rol?: string
  partnerNaam?: string
  uitgenodigdDoor?: string
  setupUrl?: string
}

const GebruikerWelkomEmail = ({ voornaam, email, rol, partnerNaam, uitgenodigdDoor, setupUrl }: Props) => {
  const url = setupUrl ?? `${SITE_URL}/login`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Welkom bij {partnerNaam ?? SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welkom{voornaam ? `, ${voornaam}` : ''}</Heading>
          <Text style={text}>
            {uitgenodigdDoor ? `${uitgenodigdDoor} heeft je uitgenodigd` : 'Je bent uitgenodigd'} om mee te werken in
            {partnerNaam ? ` het ${partnerNaam}-` : ' het '}dashboard{rol ? ` als ${rol}` : ''}.
          </Text>
          <Section style={card}>
            {email ? <Text style={row}><strong>Inlog-e-mail:</strong> {email}</Text> : null}
            {rol ? <Text style={row}><strong>Rol:</strong> {rol}</Text> : null}
            {partnerNaam ? <Text style={row}><strong>Organisatie:</strong> {partnerNaam}</Text> : null}
          </Section>
          <Text style={text}>
            Stel hieronder je wachtwoord in om aan de slag te gaan. De link is 24 uur geldig.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Wachtwoord instellen</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: GebruikerWelkomEmail,
  subject: (d: Record<string, any>) => `Welkom bij ${d?.partnerNaam ?? SITE_NAME}`,
  displayName: 'Welkom nieuwe medewerker',
  previewData: { voornaam: 'Sara', email: 'sara@example.com', rol: 'backoffice', partnerNaam: 'Smart Accu', uitgenodigdDoor: 'Roshny' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const card = { backgroundColor: '#f6f6f9', padding: '16px 20px', borderRadius: '12px', margin: '8px 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }