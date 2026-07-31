import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { home } from './home/index.js'
import { health } from './health/index.js'
import { entraId } from './entra-id/index.js'
import { defraCi } from './defra-ci/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([
        home,
        health,
        entraId,
        defraCi,
        serveStaticFiles
      ])
    }
  }
}
