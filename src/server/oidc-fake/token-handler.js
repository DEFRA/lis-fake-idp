import { statusCodes } from '../common/constants/status-codes.js'
import { buildTokens, TOKEN_TTL_SECONDS } from './build-tokens.js'
import { isValidClient } from './client-credentials.js'
import { verifyPkceS256 } from './verify-pkce.js'

/**
 * @param {{
 *   getInternalBase: () => string,
 *   signingKey: object,
 *   codeStore: object,
 *   clientId: string,
 *   clientSecret: string
 * }} options
 * @returns {Function}
 */
export function createTokenHandler({
  getInternalBase,
  signingKey,
  codeStore,
  clientId,
  clientSecret
}) {
  return function tokenHandler(request, h) {
    const {
      code,
      code_verifier: codeVerifier,
      grant_type: grantType
    } = request.payload

    if (grantType !== 'authorization_code') {
      return h
        .response({ error: 'unsupported_grant_type' })
        .type('application/json')
        .code(statusCodes.badRequest)
    }

    if (!isValidClient(request, { clientId, clientSecret })) {
      return h
        .response({
          error: 'invalid_client',
          error_description: 'Client authentication failed'
        })
        .type('application/json')
        .code(statusCodes.unauthorized)
    }

    const entry = codeStore.redeemCode(code)
    if (!entry) {
      return h
        .response({
          error: 'invalid_grant',
          error_description: 'Unknown or expired code'
        })
        .type('application/json')
        .code(statusCodes.badRequest)
    }

    if (!verifyPkceS256(codeVerifier, entry.codeChallenge)) {
      return h
        .response({
          error: 'invalid_grant',
          error_description: 'PKCE verification failed'
        })
        .type('application/json')
        .code(statusCodes.badRequest)
    }

    const { idToken, accessToken } = buildTokens({
      entry,
      issuer: getInternalBase(),
      clientId,
      signingKey
    })

    return h
      .response({
        access_token: accessToken,
        token_type: 'Bearer',
        id_token: idToken,
        expires_in: TOKEN_TTL_SECONDS
      })
      .type('application/json')
  }
}
