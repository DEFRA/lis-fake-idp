import { describe, expect, test, vi } from 'vitest'

import { createDiscoveryHandler } from './discovery-handler.js'

function makeH() {
  const h = {
    response: vi.fn(() => h),
    type: vi.fn(() => h)
  }
  return h
}

describe('createDiscoveryHandler()', () => {
  test('it derives every endpoint from the external/internal base', () => {
    // Arrange
    const handler = createDiscoveryHandler({
      getExternalBase: () => 'https://external.example.test',
      getInternalBase: () => 'https://internal.example.test'
    })
    const h = makeH()

    // Act
    handler({}, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith(
      expect.objectContaining({
        issuer: 'https://internal.example.test',
        authorization_endpoint: 'https://external.example.test/authorize',
        token_endpoint: 'https://internal.example.test/token',
        jwks_uri: 'https://internal.example.test/jwks',
        end_session_endpoint: 'https://external.example.test/logout'
      })
    )
    expect(h.type).toHaveBeenCalledWith('application/json')
  })

  test('it advertises the client auth methods this fake actually accepts', () => {
    // Arrange
    const handler = createDiscoveryHandler({
      getExternalBase: () => 'https://external.example.test',
      getInternalBase: () => 'https://internal.example.test'
    })
    const h = makeH()

    // Act
    handler({}, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith(
      expect.objectContaining({
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'client_secret_post',
          'none'
        ]
      })
    )
  })
})
