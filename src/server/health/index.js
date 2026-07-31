import { statusCodes } from '../common/constants/status-codes.js'

export const health = {
  plugin: {
    name: 'health',
    register(server) {
      server.route({
        method: 'GET',
        path: '/health',
        options: { auth: false },
        handler(_request, h) {
          return h.response({ message: 'success' }).code(statusCodes.ok)
        }
      })
    }
  }
}
