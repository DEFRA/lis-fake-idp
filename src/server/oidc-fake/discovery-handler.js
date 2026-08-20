/**
 * @param {{ getExternalBase: () => string, getInternalBase: () => string }} options
 * @returns {Function}
 */
export function createDiscoveryHandler({ getExternalBase, getInternalBase }) {
  return function discoveryHandler(_request, h) {
    const ext = getExternalBase()
    const int = getInternalBase()
    return h
      .response({
        issuer: int,
        authorization_endpoint: `${ext}/authorize`,
        token_endpoint: `${int}/token`,
        jwks_uri: `${int}/jwks`,
        end_session_endpoint: `${ext}/logout`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'client_secret_post',
          'none'
        ],
        scopes_supported: ['openid', 'offline_access', 'email', 'profile'],
        claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'email']
      })
      .type('application/json')
  }
}
