import crypto from 'node:crypto'
import { describe, expect, test } from 'vitest'

import { buildTokens, TOKEN_TTL_SECONDS } from './build-tokens.js'

function decodeJwtPayload(jwt) {
  const [, body] = jwt.split('.')
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
}

describe('buildTokens()', () => {
  test('it signs an id_token and access_token with matching claims', () => {
    // Arrange
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const signingKey = { privateKey, keyId: 'test-key-id' }
    const entry = {
      sub: 'user-1',
      nonce: 'nonce-1',
      name: 'Test Farmer',
      email: 'farmer@example.com',
      roles: ['lis-role-reader']
    }

    // Act
    const { idToken, accessToken } = buildTokens({
      entry,
      issuer: 'https://oidc-fake-test',
      clientId: 'test-client',
      signingKey
    })

    // Assert
    const idTokenClaims = decodeJwtPayload(idToken)
    expect(idTokenClaims).toEqual(
      expect.objectContaining({
        iss: 'https://oidc-fake-test',
        sub: 'user-1',
        aud: 'test-client',
        nonce: 'nonce-1',
        name: 'Test Farmer',
        email: 'farmer@example.com',
        roles: ['lis-role-reader']
      })
    )
    expect(idTokenClaims.exp - idTokenClaims.iat).toBe(TOKEN_TTL_SECONDS)

    const accessTokenClaims = decodeJwtPayload(accessToken)
    expect(accessTokenClaims).toEqual(
      expect.objectContaining({
        iss: 'https://oidc-fake-test',
        sub: 'user-1',
        aud: 'test-client'
      })
    )
    expect(accessTokenClaims).not.toHaveProperty('email')
  })
})
