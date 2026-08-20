import { statusCodes } from '../common/constants/status-codes.js'

/**
 * @param {object} request
 * @param {object} h
 * @returns {unknown}
 */
export function logoutHandler(request, h) {
  const { post_logout_redirect_uri: postLogoutRedirectUri } = request.query

  if (postLogoutRedirectUri) {
    return h.redirect(postLogoutRedirectUri)
  }

  return h.response().code(statusCodes.noContent)
}
