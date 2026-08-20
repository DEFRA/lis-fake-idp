import { buildUserItems } from './build-user-items.js'

/**
 * @param {{ label: string, users: object }} options
 * @returns {Function}
 */
export function createAuthorizeGetHandler({ label, users }) {
  return function authorizeGetHandler(request, h) {
    const {
      state,
      nonce,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    } = request.query
    return h.view('oidc-fake/login', {
      pageTitle: `Sign in — ${label}`,
      label,
      userItems: buildUserItems(users),
      state,
      nonce,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    })
  }
}
