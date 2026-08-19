import { describe, expect, test, vi } from 'vitest'
import { createServer } from '../../server.js'
import { startServer } from './start-server.js'

vi.mock('../../server.js')

const mocks = {
  createServer: vi.mocked(createServer)
}

describe('startServer()', () => {
  test('it creates, starts and returns the server', async () => {
    // Arrange
    const server = {
      start: vi.fn(),
      logger: { info: vi.fn() }
    }
    mocks.createServer.mockResolvedValue(server)

    // Act
    let result, error
    try {
      result = await startServer()
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(server.start).toHaveBeenCalled()
    expect(server.logger.info).toHaveBeenCalledWith(
      'Server started successfully'
    )
    expect(result).toBe(server)
  })
})
