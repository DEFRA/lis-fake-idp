import { describe, expect, test, vi } from 'vitest'

import { createAuthorizeGetHandler } from './authorize-get-handler.js'

const users = { 'farmer@example.com': { name: 'Test Farmer' } }

describe('createAuthorizeGetHandler()', () => {
  test('it renders the login view with the request query and fixture users', () => {
    // Arrange
    const handler = createAuthorizeGetHandler({ label: 'Test IDP', users })
    const request = {
      query: {
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
    expect(h.view).toHaveBeenCalledWith('oidc-fake/login', {
      pageTitle: 'Sign in — Test IDP',
      label: 'Test IDP',
      userItems: [
        {
          value: 'farmer@example.com',
          text: 'Test Farmer (farmer@example.com)',
          hint: undefined,
          checked: true
        }
      ],
      state: 'state-1',
      nonce: 'nonce-1',
      redirect_uri: 'https://example.com/callback',
      code_challenge: 'challenge-1',
      code_challenge_method: 'S256'
    })
    expect(result).toBe('rendered')
  })
})
