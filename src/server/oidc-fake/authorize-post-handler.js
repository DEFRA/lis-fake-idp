import { buildUserItems } from './build-user-items.js'
import {
  buildCodeRedirect,
  readAuthorizationParams
} from './authorization-redirect.js'

/**
 * @param {{ label: string, users: object, codeStore: object, cookieName: string, cookieOptions: object }} options
 * @returns {Function}
 */
export function createAuthorizePostHandler({
  label,
  users,
  codeStore,
  cookieName,
  cookieOptions
}) {
  return function authorizePostHandler(request, h) {
    const { email } = request.payload
    const params = readAuthorizationParams(request.payload)
    const user = users[email]

    if (!user) {
      return h.view('oidc-fake/login', {
        pageTitle: `Sign in — ${label}`,
        label,
        userItems: buildUserItems(users, email),
        state: params.state,
        nonce: params.nonce,
        redirect_uri: params.redirectUri,
        code_challenge: params.codeChallenge,
        code_challenge_method: params.codeChallengeMethod,
        error: `No fixture user found with email ${email}`
      })
    }

    return h
      .redirect(buildCodeRedirect({ codeStore, user, email, params }))
      .state(cookieName, email, cookieOptions)
  }
}
