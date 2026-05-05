/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je e-mailadres voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bevestig je e-mailadres</Heading>
        <Text style={text}>
          Bedankt voor je aanmelding bij{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>!
        </Text>
        <Text style={text}>
          Bevestig je e-mailadres ({recipient}) door op de knop hieronder te klikken:
        </Text>
        <Button style={button} href={confirmationUrl}>E-mail bevestigen</Button>
        <Text style={footer}>
          Heb je geen account aangemaakt? Dan kun je deze e-mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: 'hsl(242, 67%, 62%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(242, 67%, 62%)', color: '#ffffff', fontSize: '14px',
  fontWeight: 'bold' as const, borderRadius: '12px', padding: '12px 22px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888888', margin: '28px 0 0', lineHeight: '1.5' }
