/** @import { Server } from '@hapi/hapi' */
import path from 'node:path'
import hapi from '@hapi/hapi'
import Inert from '@hapi/inert'

import { router } from './router.js'
import { config } from '../config/config.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'

/**
 * @returns {Promise<Server>}
 */
export async function createServer() {
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      },
      validate: {
        options: { abortEarly: false }
      }
    },
    router: {
      stripTrailingSlash: true
    },
    state: {
      strictHeader: false
    }
  })

  await server.register([Inert, requestLogger, nunjucksConfig, router])

  server.ext('onPreResponse', catchAll)

  return server
}
