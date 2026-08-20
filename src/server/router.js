import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { health } from './health/index.js'
import { entraId } from './entra-id/index.js'
import { defraCi } from './defra-ci/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([health, entraId, defraCi, serveStaticFiles])
    }
  }
}
