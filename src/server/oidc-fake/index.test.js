import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createAuthorizeGetHandler } from './authorize-get-handler.js'
import { createAuthorizePostHandler } from './authorize-post-handler.js'
import { createCodeStore } from './code-store.js'
import { createDiscoveryHandler } from './discovery-handler.js'
import { createOidcFakePlugin } from './index.js'
import { createJwksHandler } from './jwks-handler.js'
import { buildRoutes } from './routes.js'
import { createTokenHandler } from './token-handler.js'

vi.mock('node:fs')
vi.mock('./authorize-get-handler.js')
vi.mock('./authorize-post-handler.js')
vi.mock('./code-store.js')
vi.mock('./discovery-handler.js')
vi.mock('./jwks-handler.js')
vi.mock('./routes.js')
vi.mock('./token-handler.js')

const mocks = {
  readFileSync: vi.mocked(readFileSync),
  createAuthorizeGetHandler: vi.mocked(createAuthorizeGetHandler),
  createAuthorizePostHandler: vi.mocked(createAuthorizePostHandler),
  createCodeStore: vi.mocked(createCodeStore),
  createDiscoveryHandler: vi.mocked(createDiscoveryHandler),
  createJwksHandler: vi.mocked(createJwksHandler),
  buildRoutes: vi.mocked(buildRoutes),
  createTokenHandler: vi.mocked(createTokenHandler)
}

const users = { 'farmer@example.com': { sub: 'user-1', name: 'Test Farmer' } }

describe('createOidcFakePlugin()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readFileSync.mockReturnValue(JSON.stringify(users))
    mocks.createCodeStore.mockReturnValue({ codeStore: true })
    mocks.createDiscoveryHandler.mockReturnValue('discovery-handler')
    mocks.createJwksHandler.mockReturnValue('jwks-handler')
    mocks.createAuthorizeGetHandler.mockReturnValue('authorize-get-handler')
    mocks.createAuthorizePostHandler.mockReturnValue('authorize-post-handler')
    mocks.createTokenHandler.mockReturnValue('token-handler')
    mocks.buildRoutes.mockReturnValue(['route-1', 'route-2'])
  })

  function makeOptions() {
    return {
      name: 'test-idp',
      label: 'Test IDP',
      mountPath: '/test-idp',
      fixturePath: '/fixtures/test-idp.json',
      getExternalBase: () => 'https://external.example.test',
      getInternalBase: () => 'https://internal.example.test',
      clientId: 'test-client',
      clientSecret: 'test-secret'
    }
  }

  test('it reads the fixture and wires each handler with the fixture users', () => {
    // Act
    createOidcFakePlugin(makeOptions())

    // Assert
    expect(mocks.readFileSync).toHaveBeenCalledWith(
      '/fixtures/test-idp.json',
      'utf-8'
    )
    expect(mocks.createAuthorizeGetHandler).toHaveBeenCalledWith({
      label: 'Test IDP',
      users
    })
    expect(mocks.createAuthorizePostHandler).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Test IDP', users })
    )
  })

  test('it wires the discovery and jwks handlers to the given base url getters', () => {
    // Arrange
    const options = makeOptions()

    // Act
    createOidcFakePlugin(options)

    // Assert
    expect(mocks.createDiscoveryHandler).toHaveBeenCalledWith({
      getExternalBase: options.getExternalBase,
      getInternalBase: options.getInternalBase
    })
    expect(mocks.createJwksHandler).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: expect.any(String) })
    )
  })

  test('it wires the token handler with the given client credentials', () => {
    // Arrange
    const options = makeOptions()

    // Act
    createOidcFakePlugin(options)

    // Assert
    expect(mocks.createTokenHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        getInternalBase: options.getInternalBase,
        clientId: 'test-client',
        clientSecret: 'test-secret'
      })
    )
  })

  test('it registers the routes built from the wired handlers', () => {
    // Arrange
    const { plugin } = createOidcFakePlugin(makeOptions())
    const server = { route: vi.fn() }

    // Act
    plugin.register(server)

    // Assert
    expect(mocks.buildRoutes).toHaveBeenCalledWith({
      mountPath: '/test-idp',
      handlers: {
        discoveryHandler: 'discovery-handler',
        jwksHandler: 'jwks-handler',
        authorizeGetHandler: 'authorize-get-handler',
        authorizePostHandler: 'authorize-post-handler',
        tokenHandler: 'token-handler'
      }
    })
    expect(server.route).toHaveBeenCalledWith(['route-1', 'route-2'])
  })

  test('it exposes the plugin name given', () => {
    // Act
    const { plugin } = createOidcFakePlugin(makeOptions())

    // Assert
    expect(plugin.name).toBe('test-idp')
  })
})
