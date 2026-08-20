import { beforeEach, describe, expect, test, vi } from 'vitest'

import { buildTokens } from './build-tokens.js'
import { isValidClient } from './client-credentials.js'
import { createTokenHandler } from './token-handler.js'
import { verifyPkceS256 } from './verify-pkce.js'

vi.mock('./build-tokens.js')
vi.mock('./client-credentials.js')
vi.mock('./verify-pkce.js')

const mocks = {
  buildTokens: vi.mocked(buildTokens),
  isValidClient: vi.mocked(isValidClient),
  verifyPkceS256: vi.mocked(verifyPkceS256)
}

function makeH() {
  const h = {
    response: vi.fn(() => h),
    type: vi.fn(() => h),
    code: vi.fn(() => h)
  }
  return h
}

describe('createTokenHandler()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isValidClient.mockReturnValue(true)
    mocks.verifyPkceS256.mockReturnValue(true)
    mocks.buildTokens.mockReturnValue({
      idToken: 'id-token',
      accessToken: 'access-token'
    })
  })

  function makeHandler() {
    return createTokenHandler({
      getInternalBase: () => 'https://oidc-fake-test',
      signingKey: { privateKey: 'test-key', keyId: 'test-key-id' },
      codeStore: {
        redeemCode: vi.fn(() => ({ codeChallenge: 'challenge-1' }))
      },
      clientId: 'test-client',
      clientSecret: 'test-secret'
    })
  }

  test('it rejects an unsupported grant type before checking anything else', () => {
    // Arrange
    const handler = makeHandler()
    const h = makeH()

    // Act
    handler({ payload: { grant_type: 'client_credentials' } }, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      error: 'unsupported_grant_type'
    })
    expect(h.code).toHaveBeenCalledWith(400)
    expect(mocks.isValidClient).not.toHaveBeenCalled()
  })

  test('it rejects invalid client credentials', () => {
    // Arrange
    mocks.isValidClient.mockReturnValue(false)
    const handler = makeHandler()
    const h = makeH()

    // Act
    handler({ payload: { grant_type: 'authorization_code' } }, h)

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      error: 'invalid_client',
      error_description: 'Client authentication failed'
    })
    expect(h.code).toHaveBeenCalledWith(401)
  })

  test('it rejects an unknown or expired authorization code', () => {
    // Arrange
    const codeStore = { redeemCode: vi.fn(() => null) }
    const handler = createTokenHandler({
      getInternalBase: () => 'https://oidc-fake-test',
      signingKey: {},
      codeStore,
      clientId: 'test-client',
      clientSecret: 'test-secret'
    })
    const h = makeH()

    // Act
    handler(
      { payload: { grant_type: 'authorization_code', code: 'unknown' } },
      h
    )

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      error: 'invalid_grant',
      error_description: 'Unknown or expired code'
    })
    expect(h.code).toHaveBeenCalledWith(400)
  })

  test('it rejects a code_verifier that fails PKCE verification', () => {
    // Arrange
    mocks.verifyPkceS256.mockReturnValue(false)
    const handler = makeHandler()
    const h = makeH()

    // Act
    handler(
      {
        payload: {
          grant_type: 'authorization_code',
          code: 'code-1',
          code_verifier: 'the-wrong-verifier'
        }
      },
      h
    )

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      error: 'invalid_grant',
      error_description: 'PKCE verification failed'
    })
    expect(h.code).toHaveBeenCalledWith(400)
  })

  test('it returns signed tokens for a valid request', () => {
    // Arrange
    const handler = makeHandler()
    const h = makeH()

    // Act
    handler(
      {
        payload: {
          grant_type: 'authorization_code',
          code: 'code-1',
          code_verifier: 'a-real-verifier'
        }
      },
      h
    )

    // Assert
    expect(h.response).toHaveBeenCalledWith({
      access_token: 'access-token',
      token_type: 'Bearer',
      id_token: 'id-token',
      expires_in: 3600
    })
    expect(h.type).toHaveBeenCalledWith('application/json')
  })
})
