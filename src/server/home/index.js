import { routes } from './routes.js'

export const home = {
  plugin: {
    name: 'home',
    register(server) {
      server.route(routes())
    }
  }
}
