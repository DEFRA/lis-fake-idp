import crypto from 'node:crypto'

const AUTH_CODE_BYTE_LENGTH = 32

/**
 * @param {object} query authorization request query or form payload
 * @returns {object} the authorization parameters the fake needs
 */
export function readAuthorizationParams(query) {
  return {
    state: query.state,
    nonce: query.nonce,
    redirectUri: query.redirect_uri,
    codeChallenge: query.code_challenge,
    codeChallengeMethod: query.code_challenge_method
  }
}

/**
 * Mints a single-use authorization code for a fixture user and builds the
 * redirect back to the client.
 *
 * @param {{ codeStore: object, user: object, email: string, params: object }} options
 * @returns {string} the redirect URL
 */
export function buildCodeRedirect({ codeStore, user, email, params }) {
  const code = crypto.randomBytes(AUTH_CODE_BYTE_LENGTH).toString('hex')

  codeStore.storeCode(code, {
    sub: user.sub,
    email,
    name: user.name,
    roles: user.roles ?? [],
    nonce: params.nonce,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod
  })

  const redirectUrl = new URL(params.redirectUri)
  redirectUrl.searchParams.set('code', code)
  redirectUrl.searchParams.set('state', params.state)

  return redirectUrl.href
}

/**
 * @param {{ params: object, error: string }} options
 * @returns {string} the redirect URL carrying an OAuth error response
 */
export function buildErrorRedirect({ params, error }) {
  const redirectUrl = new URL(params.redirectUri)
  redirectUrl.searchParams.set('error', error)

  if (params.state) {
    redirectUrl.searchParams.set('state', params.state)
  }

  return redirectUrl.href
}
