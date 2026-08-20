/** @import { KeyObject } from 'node:crypto' */

/**
 * @param {{ publicKey: KeyObject, keyId: string }} options
 * @returns {Function}
 */
export function createJwksHandler({ publicKey, keyId }) {
  return function jwksHandler(_request, h) {
    const jwk = publicKey.export({ format: 'jwk' })
    return h
      .response({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: keyId }] })
      .type('application/json')
  }
}
