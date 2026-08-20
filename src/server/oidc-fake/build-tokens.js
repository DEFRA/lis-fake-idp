import { signJwt } from './sign-jwt.js'

const MS_PER_SECOND = 1000
const TOKEN_TTL_SECONDS = 3600

/**
 * @param {{ entry: object, issuer: string, clientId: string, signingKey: object }} options
 * @returns {{ idToken: string, accessToken: string }}
 */
export function buildTokens({ entry, issuer, clientId, signingKey }) {
  const now = Math.floor(Date.now() / MS_PER_SECOND)

  const idToken = signJwt(
    {
      iss: issuer,
      sub: entry.sub,
      aud: clientId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      nonce: entry.nonce,
      name: entry.name,
      email: entry.email,
      roles: entry.roles
    },
    signingKey
  )

  const accessToken = signJwt(
    {
      iss: issuer,
      sub: entry.sub,
      aud: clientId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS
    },
    signingKey
  )

  return { idToken, accessToken }
}

export { TOKEN_TTL_SECONDS }
