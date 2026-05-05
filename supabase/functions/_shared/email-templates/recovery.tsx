/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Stel een nieuw wachtwoord in voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Wachtwoord opnieuw instellen</Heading>
        <Text style={text}>
          We ontvingen een verzoek om je wachtwoord voor <strong>{siteName}</strong>{' '}
          opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.
        </Text>
        <Button style={button} href={confirmationUrl}>Nieuw wachtwoord instellen</Button>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren — je wachtwoord blijft ongewijzigd.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 24px' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '28px 0 0', lineHeight: '1.5' }
