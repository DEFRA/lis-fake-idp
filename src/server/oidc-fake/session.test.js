import { describe, expect, test } from 'vitest'

import {
  createSessionCookieOptions,
  getSessionCookieName,
  readSessionEmail
} from './session.js'

describe('getSessionCookieName()', () => {
  test('it namespaces the cookie by provider name', () => {
    // Arrange
    const name = 'defra-ci'

    // Act
    const result = getSessionCookieName(name)

    // Assert
    expect(result).toEqual('oidc-fake-session-defra-ci')
  })
})

describe('createSessionCookieOptions()', () => {
  test('it scopes the cookie to the provider mount path', () => {
    // Arrange
    const mountPath = '/defra-ci'

    // Act
    const result = createSessionCookieOptions({ mountPath })

    // Assert
    expect(result).toEqual({
      ttl: null,
      isSecure: false,
      isHttpOnly: true,
      isSameSite: 'Lax',
      path: '/defra-ci',
      encoding: 'none',
      clearInvalid: true
    })
  })
})

describe('readSessionEmail()', () => {
  test('it returns the email held in the named cookie', () => {
    // Arrange
    const request = { state: { 'oidc-fake-session-defra-ci': 'a@example.com' } }

    // Act
    const result = readSessionEmail(request, 'oidc-fake-session-defra-ci')

    // Assert
    expect(result).toEqual('a@example.com')
  })

  test('it returns null when the cookie is absent', () => {
    // Arrange
    const request = { state: {} }

    // Act
    const result = readSessionEmail(request, 'oidc-fake-session-defra-ci')

    // Assert
    expect(result).toBeNull()
  })

  test('it returns null when the cookie is empty', () => {
    // Arrange
    const request = { state: { 'oidc-fake-session-defra-ci': '' } }

    // Act
    const result = readSessionEmail(request, 'oidc-fake-session-defra-ci')

    // Assert
    expect(result).toBeNull()
  })

  test('it returns null when the request carries no state', () => {
    // Arrange
    const request = undefined

    // Act
    const result = readSessionEmail(request, 'oidc-fake-session-defra-ci')

    // Assert
    expect(result).toBeNull()
  })
})
