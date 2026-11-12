/** @import { Server } from '@hapi/hapi' */

import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { health } from './health/index.js'
import { entraId } from './entra-id/index.js'
import { defraCi } from './defra-ci/index.js'

export const router = {
  plugin: {
    name: 'router',
    /**
     * Registers the application routes.
     * @param {Server} server - the Hapi server the plugin is registered on
     */
    async register(server) {
      await server.register([health, entraId, defraCi, serveStaticFiles])
    }
  }
}
