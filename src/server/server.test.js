import { describe, expect, test } from 'vitest'
import { createServer } from './server.js'

describe('createServer()', () => {
  test('it responds to the health check', async () => {
    // Arrange
    const server = await createServer()

    // Act
    const response = await server.inject({ method: 'GET', url: '/health' })

    // Assert
    expect(response.statusCode).toBe(200)
    expect(response.result).toEqual({ message: 'success' })
  })

  test.each(['defra-ci', 'entra-id'])(
    'it serves the %s fake discovery document',
    async (mountPath) => {
      // Arrange
      const server = await createServer()

      // Act
      const response = await server.inject({
        method: 'GET',
        url: `/${mountPath}/.well-known/openid-configuration`
      })

      // Assert
      expect(response.statusCode).toBe(200)
    }
  )

  test('it returns 204 with no content type asserted from the favicon route', async () => {
    // Arrange
    const server = await createServer()

    // Act
    const response = await server.inject({ method: 'GET', url: '/favicon.ico' })

    // Assert
    expect(response.statusCode).toBe(204)
  })

  test('it renders an HTML error page for a not-found route', async () => {
    // Arrange
    const server = await createServer()

    // Act
    const response = await server.inject({
      method: 'GET',
      url: '/not-a-real-route'
    })

    // Assert
    expect(response.statusCode).toBe(404)
    expect(response.result).toContain('Page not found')
  })
})
