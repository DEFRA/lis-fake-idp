import process from 'node:process'
import { startServer } from './server/common/helpers/start-server.js'
import { logger } from './server/common/helpers/logging/logger.js'

const server = await startServer()

server.logger.info(`Access the app on http://localhost:${server.info.port}`)

process.on('unhandledRejection', (error) => {
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
