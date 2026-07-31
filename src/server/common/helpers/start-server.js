/** @import { Server } from '@hapi/hapi' */
import { createServer } from '../../server.js'

/**
 * @returns {Promise<Server>}
 */
async function startServer() {
  const server = await createServer()
  await server.start()
  server.logger.info('Server started successfully')
  return server
}

export { startServer }
