import { describe, expect, test, vi } from 'vitest'

import {
  buildCodeRedirect,
  buildErrorRedirect,
  readAuthorizationParams
} from './authorization-redirect.js'

describe('readAuthorizationParams()', () => {
  test('it maps the snake_case authorization request fields', () => {
    // Arrange
    const query = {
      state: 'state-1',
      nonce: 'nonce-1',
      redirect_uri: 'https://example.com/callback',
      code_challenge: 'challenge-1',
      code_challenge_method: 'S256'
    }

    // Act
    const result = readAuthorizationParams(query)

    // Assert
    expect(result).toEqual({
      state: 'state-1',
      nonce: 'nonce-1',
      redirectUri: 'https://example.com/callback',
      codeChallenge: 'challenge-1',
      codeChallengeMethod: 'S256'
    })
  })
})

describe('buildCodeRedirect()', () => {
  test('it stores a single-use code and returns the client redirect', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const user = { sub: 'user-1', name: 'Test Farmer', roles: ['reader'] }
    const params = {
      state: 'state-1',
      nonce: 'nonce-1',
      redirectUri: 'https://example.com/callback',
      codeChallenge: 'challenge-1',
      codeChallengeMethod: 'S256'
    }

    // Act
    const result = buildCodeRedirect({
      codeStore,
      user,
      email: 'farmer@example.com',
      params
    })

    // Assert
    const redirectUrl = new URL(result)
    expect(redirectUrl.searchParams.get('state')).toEqual('state-1')
    expect(codeStore.storeCode).toHaveBeenCalledWith(
      redirectUrl.searchParams.get('code'),
      {
        sub: 'user-1',
        email: 'farmer@example.com',
        name: 'Test Farmer',
        roles: ['reader'],
        nonce: 'nonce-1',
        codeChallenge: 'challenge-1',
        codeChallengeMethod: 'S256'
      }
    )
  })

  test('it defaults roles to an empty array when the fixture user has none', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const user = { sub: 'user-1', name: 'Test Farmer' }
    const params = {
      state: 'state-1',
      nonce: 'nonce-1',
      redirectUri: 'https://example.com/callback'
    }

    // Act
    buildCodeRedirect({
      codeStore,
      user,
      email: 'farmer@example.com',
      params
    })

    // Assert
    expect(codeStore.storeCode).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ roles: [] })
    )
  })
})

describe('buildErrorRedirect()', () => {
  test('it returns the client redirect carrying the error and state', () => {
    // Arrange
    const params = {
      redirectUri: 'https://example.com/callback',
      state: 'state-1'
    }

    // Act
    const result = buildErrorRedirect({ params, error: 'login_required' })

    // Assert
    const redirectUrl = new URL(result)
    expect(redirectUrl.searchParams.get('error')).toEqual('login_required')
    expect(redirectUrl.searchParams.get('state')).toEqual('state-1')
  })

  test('it omits the state when the request carried none', () => {
    // Arrange
    const params = { redirectUri: 'https://example.com/callback' }

    // Act
    const result = buildErrorRedirect({ params, error: 'login_required' })

    // Assert
    const redirectUrl = new URL(result)
    expect(redirectUrl.searchParams.get('state')).toBeNull()
  })
})
