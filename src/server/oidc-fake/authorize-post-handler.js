import crypto from 'node:crypto'
import { buildUserItems } from './build-user-items.js'

const AUTH_CODE_BYTE_LENGTH = 32

/**
 * @param {{ label: string, users: object, codeStore: object }} options
 * @returns {Function}
 */
export function createAuthorizePostHandler({ label, users, codeStore }) {
  return function authorizePostHandler(request, h) {
    const {
      email,
      state,
      nonce,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    } = request.payload

    const user = users[email]

    if (!user) {
      return h.view('oidc-fake/login', {
        pageTitle: `Sign in — ${label}`,
        label,
        userItems: buildUserItems(users, email),
        state,
        nonce,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        error: `No fixture user found with email ${email}`
      })
    }

    const code = crypto.randomBytes(AUTH_CODE_BYTE_LENGTH).toString('hex')
    codeStore.storeCode(code, {
      sub: user.sub,
      email,
      name: user.name,
      roles: user.roles ?? [],
      nonce,
      codeChallenge,
      codeChallengeMethod
    })

    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('code', code)
    redirectUrl.searchParams.set('state', state)
    return h.redirect(redirectUrl.href)
  }
}
