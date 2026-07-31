/** @import { Request, ResponseToolkit, Lifecycle } from '@hapi/hapi' */

const fakes = [
  { label: 'DEFRA CI', path: '/defra-ci/.well-known/openid-configuration' },
  { label: 'Entra ID', path: '/entra-id/.well-known/openid-configuration' }
]

export const homeController = {
  /**
   * @param {Request} _request
   * @param {ResponseToolkit} h
   * @returns {Lifecycle.ReturnValue}
   */
  handler(_request, h) {
    return h.view('home/home', {
      pageTitle: 'Livestock fake service',
      heading: 'Livestock fake service',
      fakes
    })
  }
}
