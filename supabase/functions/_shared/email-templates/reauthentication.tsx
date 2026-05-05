/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bevestig je identiteit</Heading>
        <Text style={text}>Gebruik onderstaande code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Deze code verloopt binnenkort. Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: 'Courier, monospace', fontSize: '24px', fontWeight: 'bold' as const,
  color: 'hsl(242, 67%, 62%)', letterSpacing: '4px', margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#888888', margin: '28px 0 0', lineHeight: '1.5' }
