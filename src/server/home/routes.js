/** @import { ServerRoute } from '@hapi/hapi' */
import { homeController } from './controllers/home-controller.js'

/**
 * @returns {ServerRoute[]}
 */
export const routes = () => [
  {
    method: 'GET',
    path: '/',
    options: { auth: false },
    ...homeController
  }
]
