import { describe, expect, test, vi } from 'vitest'

import { createAuthorizeGetHandler } from './authorize-get-handler.js'

const users = {
  'farmer@example.com': { sub: 'sub-1', name: 'Test Farmer' },
  'other@example.com': { sub: 'sub-2', name: 'Other Farmer' }
}

const cookieName = 'oidc-fake-session-test'

function makeQuery(extra = {}) {
  return {
    state: 'state-1',
    nonce: 'nonce-1',
    redirect_uri: 'https://example.com/callback',
    code_challenge: 'challenge-1',
    code_challenge_method: 'S256',
    ...extra
  }
}

describe('createAuthorizeGetHandler()', () => {
  test('it renders the login view with the request query and fixture users', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = { query: makeQuery(), state: {} }
    const h = { view: vi.fn(() => 'rendered'), redirect: vi.fn() }

    // Act
    const result = handler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith('oidc-fake/login', {
      pageTitle: 'Sign in — Test IDP',
      label: 'Test IDP',
      userItems: [
        {
          value: 'farmer@example.com',
          text: 'Test Farmer (farmer@example.com)',
          hint: undefined,
          checked: true
        },
        {
          value: 'other@example.com',
          text: 'Other Farmer (other@example.com)',
          hint: undefined,
          checked: false
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

  test('it signs an existing session straight back to the client without a page', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = {
      query: makeQuery(),
      state: { [cookieName]: 'other@example.com' }
    }
    const h = { view: vi.fn(), redirect: vi.fn(() => 'redirected') }

    // Act
    const result = handler(request, h)

    // Assert
    expect(h.view).not.toHaveBeenCalled()
    expect(result).toBe('redirected')
    const redirectUrl = new URL(h.redirect.mock.calls[0][0])
    expect(redirectUrl.origin + redirectUrl.pathname).toEqual(
      'https://example.com/callback'
    )
    expect(redirectUrl.searchParams.get('state')).toEqual('state-1')
    expect(redirectUrl.searchParams.get('code')).toEqual(expect.any(String))
    expect(codeStore.storeCode).toHaveBeenCalledWith(
      redirectUrl.searchParams.get('code'),
      {
        sub: 'sub-2',
        email: 'other@example.com',
        name: 'Other Farmer',
        roles: [],
        nonce: 'nonce-1',
        codeChallenge: 'challenge-1',
        codeChallengeMethod: 'S256'
      }
    )
  })

  test('it shows the picker when the client asks for prompt=login', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = {
      query: makeQuery({ prompt: 'login' }),
      state: { [cookieName]: 'other@example.com' }
    }
    const h = { view: vi.fn(() => 'rendered'), redirect: vi.fn() }

    // Act
    handler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.view.mock.calls[0][1].userItems[0].checked).toBe(true)
  })

  test('it shows the picker with the session user selected for prompt=select_account', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = {
      query: makeQuery({ prompt: 'select_account' }),
      state: { [cookieName]: 'other@example.com' }
    }
    const h = { view: vi.fn(() => 'rendered'), redirect: vi.fn() }

    // Act
    handler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    const items = h.view.mock.calls[0][1].userItems
    expect(items[0].checked).toBe(false)
    expect(items[1].checked).toBe(true)
  })

  test('it returns login_required for prompt=none with no session', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = { query: makeQuery({ prompt: 'none' }), state: {} }
    const h = { view: vi.fn(), redirect: vi.fn(() => 'redirected') }

    // Act
    handler(request, h)

    // Assert
    expect(h.view).not.toHaveBeenCalled()
    const redirectUrl = new URL(h.redirect.mock.calls[0][0])
    expect(redirectUrl.searchParams.get('error')).toEqual('login_required')
    expect(redirectUrl.searchParams.get('state')).toEqual('state-1')
    expect(redirectUrl.searchParams.get('code')).toBeNull()
  })

  test('it returns interaction_required when prompt=none cannot show the picker it also asks for', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = {
      query: makeQuery({ prompt: 'none select_account' }),
      state: { [cookieName]: 'other@example.com' }
    }
    const h = { view: vi.fn(), redirect: vi.fn(() => 'redirected') }

    // Act
    handler(request, h)

    // Assert
    expect(h.view).not.toHaveBeenCalled()
    const redirectUrl = new URL(h.redirect.mock.calls[0][0])
    expect(redirectUrl.searchParams.get('error')).toEqual(
      'interaction_required'
    )
  })

  test('it falls back to the picker when the session user is no longer a fixture', () => {
    // Arrange
    const codeStore = { storeCode: vi.fn() }
    const handler = createAuthorizeGetHandler({
      label: 'Test IDP',
      users,
      codeStore,
      cookieName
    })
    const request = {
      query: makeQuery(),
      state: { [cookieName]: 'removed@example.com' }
    }
    const h = { view: vi.fn(() => 'rendered'), redirect: vi.fn() }

    // Act
    handler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    expect(codeStore.storeCode).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalled()
  })
})
