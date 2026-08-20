const BASIC_AUTH_PREFIX = 'Basic '

/**
 * Reads client_secret_basic (Authorization header) or client_secret_post
 * (payload) credentials, per the auth methods this fake advertises in its
 * discovery document.
 *
 * @param {object} request
 * @returns {{ clientId: string | undefined, clientSecret: string | undefined }}
 */
export function getClientCredentials(request) {
  const auth = request.headers.authorization
  if (auth?.startsWith(BASIC_AUTH_PREFIX)) {
    const decoded = Buffer.from(
      auth.slice(BASIC_AUTH_PREFIX.length),
      'base64'
    ).toString()
    const [clientId, clientSecret] = decoded.split(':')
    return { clientId, clientSecret }
  }
  return {
    clientId: request.payload?.client_id,
    clientSecret: request.payload?.client_secret
  }
}

/**
 * @param {object} request
 * @param {{ clientId: string, clientSecret: string }} expected
 * @returns {boolean}
 */
export function isValidClient(request, { clientId, clientSecret }) {
  const provided = getClientCredentials(request)
  return (
    provided.clientId === clientId && provided.clientSecret === clientSecret
  )
}
