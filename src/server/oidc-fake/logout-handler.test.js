import { describe, expect, test, vi } from 'vitest'

import { createLogoutHandler } from './logout-handler.js'

const cookieName = 'oidc-fake-session-test'
const cookieOptions = { path: '/test' }

function makeH() {
  const response = {
    code: vi.fn(() => response),
    unstate: vi.fn(() => 'unstated')
  }
  const h = {
    redirect: vi.fn(() => response),
    response: vi.fn(() => response),
    result: response
  }
  return h
}

describe('createLogoutHandler()', () => {
  test('it redirects to the post_logout_redirect_uri when provided', () => {
    // Arrange
    const handler = createLogoutHandler({ cookieName, cookieOptions })
    const request = {
      query: { post_logout_redirect_uri: 'https://example.com/signed-out' }
    }
    const h = makeH()

    // Act
    const result = handler(request, h)

    // Assert
    expect(h.redirect).toHaveBeenCalledWith('https://example.com/signed-out')
    expect(h.result.unstate).toHaveBeenCalledWith(cookieName, cookieOptions)
    expect(result).toBe('unstated')
  })

  test('it returns 204 when no redirect uri is provided', () => {
    // Arrange
    const handler = createLogoutHandler({ cookieName, cookieOptions })
    const request = { query: {} }
    const h = makeH()

    // Act
    handler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.result.code).toHaveBeenCalledWith(204)
    expect(h.result.unstate).toHaveBeenCalledWith(cookieName, cookieOptions)
  })
})
