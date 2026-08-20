import { describe, expect, test, vi } from 'vitest'

import { logoutHandler } from './logout-handler.js'

function makeH() {
  const h = {
    redirect: vi.fn(() => 'redirected'),
    response: vi.fn(() => h),
    code: vi.fn(() => h)
  }
  return h
}

describe('logoutHandler()', () => {
  test('it redirects to the post_logout_redirect_uri when provided', () => {
    // Arrange
    const request = {
      query: { post_logout_redirect_uri: 'https://example.com/signed-out' }
    }
    const h = makeH()

    // Act
    const result = logoutHandler(request, h)

    // Assert
    expect(h.redirect).toHaveBeenCalledWith('https://example.com/signed-out')
    expect(result).toBe('redirected')
  })

  test('it returns 204 when no redirect uri is provided', () => {
    // Arrange
    const request = { query: {} }
    const h = makeH()

    // Act
    logoutHandler(request, h)

    // Assert
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.code).toHaveBeenCalledWith(204)
  })
})
