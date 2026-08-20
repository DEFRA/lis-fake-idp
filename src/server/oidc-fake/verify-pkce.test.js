import crypto from 'node:crypto'
import { describe, expect, test } from 'vitest'

import { verifyPkceS256 } from './verify-pkce.js'

function challengeFor(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

describe('verifyPkceS256()', () => {
  test('it accepts a verifier that matches the challenge', () => {
    // Arrange
    const verifier = 'a-real-code-verifier'
    const challenge = challengeFor(verifier)

    // Act
    const result = verifyPkceS256(verifier, challenge)

    // Assert
    expect(result).toBe(true)
  })

  test('it rejects a verifier that does not match the challenge', () => {
    // Arrange
    const challenge = challengeFor('a-real-code-verifier')

    // Act
    const result = verifyPkceS256('the-wrong-verifier', challenge)

    // Assert
    expect(result).toBe(false)
  })
})
