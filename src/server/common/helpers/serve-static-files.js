import { config } from '../../../config/config.js'
import { statusCodes } from '../constants/status-codes.js'

export const serveStaticFiles = {
  plugin: {
    name: 'staticFiles',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/favicon.ico',
          options: { auth: false },
          handler(_request, h) {
            return h.response().code(statusCodes.noContent).type('image/x-icon')
          }
        },
        {
          method: 'GET',
          path: `${config.get('assetPath')}/{param*}`,
          options: {
            auth: false,
            cache: {
              expiresIn: config.get('staticCacheTimeout'),
              privacy: 'private'
            }
          },
          handler: {
            directory: {
              path: '.',
              redirectToSlash: true
            }
          }
        }
      ])
    }
  }
}
