/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mijnhuis.nu'
const SITE_URL = 'https://app.mijnhuis.nu'

interface Props {
  type?: 'feedback' | 'functieverzoek'
  titel?: string
  beschrijving?: string
  prioriteit?: string
  categorie?: string
  indienerNaam?: string
  indienerEmail?: string
  partnerNaam?: string
  feedbackUrl?: string
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const Email = ({
  type, titel, beschrijving, prioriteit, categorie, indienerNaam, indienerEmail, partnerNaam, feedbackUrl,
}: Props) => {
  const isVerzoek = type === 'functieverzoek'
  const url = feedbackUrl ?? `${SITE_URL}/feedback-admin`
  const samenvatting = beschrijving ? stripHtml(beschrijving).slice(0, 400) : ''
  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{isVerzoek ? 'Nieuw functieverzoek' : 'Nieuwe feedback'}: {titel ?? ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{isVerzoek ? 'Nieuw functieverzoek' : 'Nieuwe feedback'}</Heading>
          <Text style={text}>Er is een {isVerzoek ? 'functieverzoek' : 'feedbackmelding'} ingediend op het platform.</Text>
          <Section style={card}>
            {titel ? <Text style={row}><strong>Titel:</strong> {titel}</Text> : null}
            {categorie ? <Text style={row}><strong>Categorie:</strong> {categorie}</Text> : null}
            {prioriteit ? <Text style={row}><strong>Prioriteit:</strong> {prioriteit}</Text> : null}
            {indienerNaam || indienerEmail ? (
              <Text style={row}><strong>Indiener:</strong> {[indienerNaam, indienerEmail].filter(Boolean).join(' — ')}</Text>
            ) : null}
            {partnerNaam ? <Text style={row}><strong>Partner:</strong> {partnerNaam}</Text> : null}
          </Section>
          {samenvatting ? <Text style={quote}>{samenvatting}</Text> : null}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={url}>Open in feedbackbeheer</Button>
          </Section>
          <Text style={footer}>— {SITE_NAME} platformbeheer</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d?.type === 'functieverzoek' ? 'Nieuw functieverzoek' : 'Nieuwe feedback'}: ${d?.titel ?? ''}`.trim(),
  displayName: 'Feedback - nieuw (platformadmin)',
  previewData: {
    type: 'feedback', titel: 'Knop werkt niet op mobiel', categorie: 'bug', prioriteit: 'hoog',
    indienerNaam: 'Jan Jansen', indienerEmail: 'jan@voorbeeld.nl', partnerNaam: 'Voorbeeld BV',
    beschrijving: 'De opslaan-knop reageert niet op mijn telefoon.',
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