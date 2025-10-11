import { SignJWT, importPKCS8 } from 'jose';

const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY as string;
const keyId = process.env.APPLE_MUSIC_KEY_ID as string;
const teamId = process.env.APPLE_MUSIC_TEAM_ID as string;
const tokenDuration = 15777000; // 6 months in seconds

const origins = ['https://nicholasgriffin.dev', 'http://localhost:3000'];

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getMusicKitToken() {
  if (!privateKey || !keyId || !teamId) {
    throw new Error('Missing Apple Music credentials in environment variables');
  }

  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiry && now < tokenExpiry - 60) {
    return cachedToken;
  }

  const privateKeyImported = await importPKCS8(privateKey, 'ES256');

  const jwt = await new SignJWT({ origin: origins })
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + tokenDuration)
    .sign(privateKeyImported);

  cachedToken = jwt;
  tokenExpiry = now + tokenDuration;

  return jwt;
}
