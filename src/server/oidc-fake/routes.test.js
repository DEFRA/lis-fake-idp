import { describe, expect, test, vi } from 'vitest'

import { buildRoutes } from './routes.js'

describe('buildRoutes()', () => {
  test('it mounts each endpoint under the given path with auth disabled', () => {
    // Arrange
    const handlers = {
      discoveryHandler: vi.fn(),
      jwksHandler: vi.fn(),
      authorizeGetHandler: vi.fn(),
      authorizePostHandler: vi.fn(),
      tokenHandler: vi.fn()
    }

    // Act
    const routes = buildRoutes({ mountPath: '/test-idp', handlers })

    // Assert
    expect(routes).toEqual([
      {
        method: 'GET',
        path: '/test-idp/.well-known/openid-configuration',
        options: { auth: false },
        handler: handlers.discoveryHandler
      },
      {
        method: 'GET',
        path: '/test-idp/jwks',
        options: { auth: false },
        handler: handlers.jwksHandler
      },
      {
        method: 'GET',
        path: '/test-idp/logout',
        options: { auth: false },
        handler: expect.any(Function)
      },
      {
        method: 'GET',
        path: '/test-idp/authorize',
        options: { auth: false },
        handler: handlers.authorizeGetHandler
      },
      {
        method: 'POST',
        path: '/test-idp/authorize',
        options: { auth: false },
        handler: handlers.authorizePostHandler
      },
      {
        method: 'POST',
        path: '/test-idp/token',
        options: { auth: false },
        handler: handlers.tokenHandler
      }
    ])
  })
})
