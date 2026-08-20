import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createAuthorizeGetHandler } from './authorize-get-handler.js'
import { createAuthorizePostHandler } from './authorize-post-handler.js'
import { createCodeStore } from './code-store.js'
import { createDiscoveryHandler } from './discovery-handler.js'
import { createJwksHandler } from './jwks-handler.js'
import { buildRoutes } from './routes.js'
import { createTokenHandler } from './token-handler.js'

const RSA_MODULUS_LENGTH = 2048

/**
 * Builds a fixture-backed, self-contained OIDC provider fake: discovery
 * document, JWKS, authorization-code + PKCE flow, RS256-signed tokens.
 *
 * @param {{
 *   name: string,
 *   label: string,
 *   mountPath: string,
 *   fixturePath: string,
 *   getExternalBase: () => string,
 *   getInternalBase: () => string,
 *   clientId: string,
 *   clientSecret: string
 * }} options
 * @returns {{ plugin: { name: string, register: Function } }}
 */
export function createOidcFakePlugin({
  name,
  label,
  mountPath,
  fixturePath,
  getExternalBase,
  getInternalBase,
  clientId,
  clientSecret
}) {
  const keyId = crypto.randomUUID()
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: RSA_MODULUS_LENGTH
  })
  const signingKey = { privateKey, keyId }
  const users = JSON.parse(readFileSync(fixturePath, 'utf-8'))
  const codeStore = createCodeStore()

  const discoveryHandler = createDiscoveryHandler({
    getExternalBase,
    getInternalBase
  })
  const jwksHandler = createJwksHandler({ publicKey, keyId })
  const authorizeGetHandler = createAuthorizeGetHandler({ label, users })
  const authorizePostHandler = createAuthorizePostHandler({
    label,
    users,
    codeStore
  })
  const tokenHandler = createTokenHandler({
    getInternalBase,
    signingKey,
    codeStore,
    clientId,
    clientSecret
  })

  return {
    plugin: {
      name,
      register(server) {
        server.route(
          buildRoutes({
            mountPath,
            handlers: {
              discoveryHandler,
              jwksHandler,
              authorizeGetHandler,
              authorizePostHandler,
              tokenHandler
            }
          })
        )
      }
    }
  }
}
