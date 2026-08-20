import crypto from 'node:crypto'
import { describe, expect, test, vi } from 'vitest'

import { createJwksHandler } from './jwks-handler.js'

function makeH() {
  const h = {
    response: vi.fn(() => h),
    type: vi.fn(() => h)
  }
  return h
}

describe('createJwksHandler()', () => {
  test('it serves the public key as a signing JWK', () => {
    // Arrange
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const handler = createJwksHandler({ publicKey, keyId: 'test-key-id' })
    const h = makeH()

    // Act
    handler({}, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      keys: [
        expect.objectContaining({
          kty: 'RSA',
          use: 'sig',
          alg: 'RS256',
          kid: 'test-key-id'
        })
      ]
    })
    expect(h.type).toHaveBeenCalledWith('application/json')
  })
})
