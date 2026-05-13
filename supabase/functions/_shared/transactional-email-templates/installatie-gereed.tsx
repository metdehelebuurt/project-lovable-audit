/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://mijnhuis.nu'

interface Props {
  installatienummer?: string
  klantNaam?: string
  monteurNaam?: string
  installatieUrl?: string
}

const InstallatieGereedEmail = ({ installatienummer, klantNaam, monteurNaam, installatieUrl }: Props) => {
  const url = installatieUrl ?? `${SITE_URL}/installaties`
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>Installatie {installatienummer ?? ''} gereed gemeld</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Installatie gereed gemeld</Heading>
          <Text style={text}>
            {monteurNaam ?? 'De monteur'} heeft installatie{installatienummer ? ` ${installatienummer}` : ''}
            {klantNaam ? ` bij ${klantNaam}` : ''} gereed gemeld. Volgende stap: opleverrapport opstellen.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open installatie</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InstallatieGereedEmail,
  subject: (d: Record<string, any>) => `Installatie ${d?.installatienummer ?? ''} gereed gemeld`.trim(),
  displayName: 'Installatie gereed',
  previewData: { installatienummer: 'INST-2025-0007', klantNaam: 'Jan Jansen', monteurNaam: 'Peter de Vries' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 12px' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }