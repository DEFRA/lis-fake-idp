import { statusCodes } from '../common/constants/status-codes.js'

/**
 * @param {{ cookieName: string, cookieOptions: object }} options
 * @returns {Function}
 */
export function createLogoutHandler({ cookieName, cookieOptions }) {
  return function logoutHandler(request, h) {
    const { post_logout_redirect_uri: postLogoutRedirectUri } = request.query
    const response = postLogoutRedirectUri
      ? h.redirect(postLogoutRedirectUri)
      : h.response().code(statusCodes.noContent)

    return response.unstate(cookieName, cookieOptions)
  }
}
