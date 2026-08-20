import { logoutHandler } from './logout-handler.js'

/**
 * @param {{ mountPath: string, handlers: object }} options
 * @returns {Array<object>}
 */
export function buildRoutes({ mountPath, handlers }) {
  const {
    discoveryHandler,
    jwksHandler,
    authorizeGetHandler,
    authorizePostHandler,
    tokenHandler
  } = handlers

  return [
    {
      method: 'GET',
      path: `${mountPath}/.well-known/openid-configuration`,
      options: { auth: false },
      handler: discoveryHandler
    },
    {
      method: 'GET',
      path: `${mountPath}/jwks`,
      options: { auth: false },
      handler: jwksHandler
    },
    {
      method: 'GET',
      path: `${mountPath}/logout`,
      options: { auth: false },
      handler: logoutHandler
    },
    {
      method: 'GET',
      path: `${mountPath}/authorize`,
      options: { auth: false },
      handler: authorizeGetHandler
    },
    {
      method: 'POST',
      path: `${mountPath}/authorize`,
      options: { auth: false },
      handler: authorizePostHandler
    },
    {
      method: 'POST',
      path: `${mountPath}/token`,
      options: { auth: false },
      handler: tokenHandler
    }
  ]
}
