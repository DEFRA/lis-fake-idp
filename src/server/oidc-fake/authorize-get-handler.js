import { buildUserItems } from './build-user-items.js'
import {
  buildCodeRedirect,
  buildErrorRedirect,
  readAuthorizationParams
} from './authorization-redirect.js'
import { readSessionEmail } from './session.js'

function parsePrompts(prompt) {
  if (typeof prompt !== 'string') {
    return []
  }

  return prompt.split(' ').filter(Boolean)
}

/**
 * @param {{ label: string, users: object, codeStore: object, cookieName: string }} options
 * @returns {Function}
 */
export function createAuthorizeGetHandler({
  label,
  users,
  codeStore,
  cookieName
}) {
  return function authorizeGetHandler(request, h) {
    const params = readAuthorizationParams(request.query)
    const prompts = parsePrompts(request.query.prompt)
    const sessionEmail = prompts.includes('login')
      ? null
      : readSessionEmail(request, cookieName)
    const sessionUser = sessionEmail ? users[sessionEmail] : undefined

    if (sessionUser && !prompts.includes('select_account')) {
      return h.redirect(
        buildCodeRedirect({
          codeStore,
          user: sessionUser,
          email: sessionEmail,
          params
        })
      )
    }

    if (prompts.includes('none')) {
      return h.redirect(
        buildErrorRedirect({
          params,
          error: sessionUser ? 'interaction_required' : 'login_required'
        })
      )
    }

    return h.view('oidc-fake/login', {
      pageTitle: `Sign in — ${label}`,
      label,
      userItems: buildUserItems(users, sessionEmail ?? undefined),
      state: params.state,
      nonce: params.nonce,
      redirect_uri: params.redirectUri,
      code_challenge: params.codeChallenge,
      code_challenge_method: params.codeChallengeMethod
    })
  }
}
