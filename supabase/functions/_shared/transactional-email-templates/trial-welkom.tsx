/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface TrialWelkomProps {
  voornaam?: string
  bedrijfsnaam?: string
  loginUrl?: string
}

const TrialWelkomEmail = ({ voornaam, bedrijfsnaam, loginUrl }: TrialWelkomProps) => {
  const naam = voornaam ?? 'daar'
  const bedrijf = bedrijfsnaam ?? 'je organisatie'
  const url = loginUrl ?? `${SITE_URL}/login`

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Welkom bij {SITE_NAME} — je proefperiode is gestart</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welkom bij {SITE_NAME}, {naam}!</Heading>
          <Text style={text}>
            Je 30‑daagse proefperiode voor <strong>{bedrijf}</strong> is gestart.
            Je kunt direct aan de slag met leads, schouwen, offertes, planning,
            installaties en meer.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Ga naar mijn dashboard</Button>
          </Section>
          <Text style={text}>
            Tip: koppel je eigen Gmail of Outlook in <em>Profiel → E-mail</em>,
            dan worden offertes en facturen vanuit jouw eigen postvak verstuurd.
          </Text>
          <Text style={footer}>
            Hulp nodig? Beantwoord deze mail of bekijk de helpdesk in het platform.
            <br />— Team {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TrialWelkomEmail,
  subject: (data: Record<string, any>) =>
    `Welkom bij ${SITE_NAME}${data?.bedrijfsnaam ? `, ${data.bedrijfsnaam}` : ''}`,
  displayName: 'Trial welkomstmail',
  previewData: { voornaam: 'Jan', bedrijfsnaam: 'Voorbeeld B.V.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '12px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }