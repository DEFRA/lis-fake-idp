/**
 * @param {string} name provider plugin name
 * @returns {string} cookie name holding the signed-in fixture user's email
 */
export function getSessionCookieName(name) {
  return `oidc-fake-session-${name}`
}

/**
 * Builds the Hapi cookie definition for a provider's sign-in session.
 * Scoped to the provider's mount path so each fake provider keeps its own
 * session, mirroring separate real tenants. Not marked secure because the
 * fake is reached over plain http as well as https in local development.
 *
 * @param {{ mountPath: string }} options
 * @returns {object} Hapi state options
 */
export function createSessionCookieOptions({ mountPath }) {
  return {
    ttl: null,
    isSecure: false,
    isHttpOnly: true,
    isSameSite: 'Lax',
    path: mountPath,
    encoding: 'none',
    clearInvalid: true
  }
}

/**
 * @param {object} request
 * @param {string} cookieName
 * @returns {string | null} the signed-in email, or null when absent
 */
export function readSessionEmail(request, cookieName) {
  const email = request?.state?.[cookieName]

  return typeof email === 'string' && email.length > 0 ? email : null
}
