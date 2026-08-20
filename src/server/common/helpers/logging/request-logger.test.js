import { describe, expect, test } from 'vitest'
import hapiPino from 'hapi-pino'
import { loggerOptions } from './logger-options.js'
import { requestLogger } from './request-logger.js'

describe('requestLogger', () => {
  test('it wraps hapi-pino with the shared logger options', () => {
    // Arrange & Act
    const { plugin, options } = requestLogger

    // Assert
    expect(plugin).toBe(hapiPino)
    expect(options).toBe(loggerOptions)
  })
})
