import { describe, expect, test, vi } from 'vitest'

import { createAuthorizePostHandler } from './authorize-post-handler.js'

const users = {
  'farmer@example.com': {
    sub: 'user-1',
    name: 'Test Farmer',
    roles: ['lis-role-reader']
  }
}

describe('createAuthorizePostHandler()', () => {
  test('it stores an authorization code and redirects with it plus the original state', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizePostHandler({
      label: 'Test IDP',
      users,
      codeStore
    })
    const request = {
      payload: {
        email: 'farmer@example.com',
        state: 'state-1',
        nonce: 'nonce-1',
        redirect_uri: 'https://example.com/callback',
        code_challenge: 'challenge-1',
        code_challenge_method: 'S256'
      }
    }
    const h = { redirect: vi.fn(() => 'redirected') }

    // Act
    const result = handler(request, h)

    // Assert
    expect(codeStore.storeCode).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        sub: 'user-1',
        email: 'farmer@example.com',
        name: 'Test Farmer',
        roles: ['lis-role-reader'],
        nonce: 'nonce-1',
        codeChallenge: 'challenge-1',
        codeChallengeMethod: 'S256'
      })
    )
    const [redirectUrl] = h.redirect.mock.calls[0]
    const url = new URL(redirectUrl)
    expect(url.origin + url.pathname).toBe('https://example.com/callback')
    expect(url.searchParams.get('state')).toBe('state-1')
    expect(url.searchParams.get('code')).toBeTruthy()
    expect(result).toBe('redirected')
  })

  test('it defaults roles to an empty array when the fixture user has none', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizePostHandler({
      label: 'Test IDP',
      users: { 'no-roles@example.com': { sub: 'user-2', name: 'No Roles' } },
      codeStore
    })
    const request = {
      payload: {
        email: 'no-roles@example.com',
        state: 'state-1',
        nonce: 'nonce-1',
        redirect_uri: 'https://example.com/callback',
        code_challenge: 'challenge-1',
        code_challenge_method: 'S256'
      }
    }
    const h = { redirect: vi.fn(() => 'redirected') }

    // Act
    handler(request, h)

    // Assert
    expect(codeStore.storeCode).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ roles: [] })
    )
  })

  test('it re-renders the login view with an error for an unknown fixture email', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizePostHandler({
      label: 'Test IDP',
      users,
      codeStore
    })
    const request = {
      payload: {
        email: 'not-a-fixture-user@example.com',
        state: 'state-1',
        nonce: 'nonce-1',
        redirect_uri: 'https://example.com/callback',
        code_challenge: 'challenge-1',
        code_challenge_method: 'S256'
      }
    }
    const h = { view: vi.fn(() => 'rendered') }

    // Act
    const result = handler(request, h)

    // Assert
    expect(codeStore.storeCode).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(
      'oidc-fake/login',
      expect.objectContaining({
        error: 'No fixture user found with email not-a-fixture-user@example.com'
      })
    )
    expect(result).toBe('rendered')
  })
})
