import crypto from 'node:crypto'
import { describe, expect, test } from 'vitest'

import { signJwt } from './sign-jwt.js'

function decodeJwtPayload(jwt) {
  const [, body] = jwt.split('.')
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
}

describe('signJwt()', () => {
  test('it produces a JWT whose payload round-trips', () => {
    // Arrange
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const signingKey = { privateKey, keyId: 'test-key-id' }
    const payload = { sub: 'user-1', aud: 'test-client' }

    // Act
    const jwt = signJwt(payload, signingKey)

    // Assert
    expect(jwt.split('.')).toHaveLength(3)
    expect(decodeJwtPayload(jwt)).toEqual(payload)
  })

  test('it signs with the given key id in the header', () => {
    // Arrange
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const signingKey = { privateKey, keyId: 'test-key-id' }

    // Act
    const jwt = signJwt({ sub: 'user-1' }, signingKey)
    const [headerSegment] = jwt.split('.')
    const header = JSON.parse(
      Buffer.from(headerSegment, 'base64url').toString('utf-8')
    )

    // Assert
    expect(header).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'test-key-id' })
  })

  test('it produces a verifiable signature', () => {
    // Arrange
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const signingKey = { privateKey, keyId: 'test-key-id' }

    // Act
    const jwt = signJwt({ sub: 'user-1' }, signingKey)
    const [header, body, signature] = jwt.split('.')

    // Assert
    expect(
      crypto
        .createVerify('sha256')
        .update(`${header}.${body}`)
        .verify(publicKey, signature, 'base64url')
    ).toBe(true)
  })
})
