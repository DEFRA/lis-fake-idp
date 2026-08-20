import { describe, expect, test } from 'vitest'

import { getClientCredentials, isValidClient } from './client-credentials.js'

describe('getClientCredentials()', () => {
  test('it reads credentials from a client_secret_post payload', () => {
    // Arrange
    const request = {
      headers: {},
      payload: { client_id: 'a-client', client_secret: 'a-secret' }
    }

    // Act
    const result = getClientCredentials(request)

    // Assert
    expect(result).toEqual({ clientId: 'a-client', clientSecret: 'a-secret' })
  })

  test('it reads credentials from a client_secret_basic Authorization header', () => {
    // Arrange
    const basicAuth = Buffer.from('a-client:a-secret').toString('base64')
    const request = {
      headers: { authorization: `Basic ${basicAuth}` },
      payload: {}
    }

    // Act
    const result = getClientCredentials(request)

    // Assert
    expect(result).toEqual({ clientId: 'a-client', clientSecret: 'a-secret' })
  })

  test('it prefers the Authorization header over the payload when both are present', () => {
    // Arrange
    const basicAuth = Buffer.from('header-client:header-secret').toString(
      'base64'
    )
    const request = {
      headers: { authorization: `Basic ${basicAuth}` },
      payload: { client_id: 'payload-client', client_secret: 'payload-secret' }
    }

    // Act
    const result = getClientCredentials(request)

    // Assert
    expect(result).toEqual({
      clientId: 'header-client',
      clientSecret: 'header-secret'
    })
  })

  test('it returns undefined credentials when none are provided', () => {
    // Arrange
    const request = { headers: {}, payload: {} }

    // Act
    const result = getClientCredentials(request)

    // Assert
    expect(result).toEqual({ clientId: undefined, clientSecret: undefined })
  })
})

describe('isValidClient()', () => {
  test('it accepts matching credentials', () => {
    // Arrange
    const request = {
      headers: {},
      payload: { client_id: 'a-client', client_secret: 'a-secret' }
    }

    // Act
    const result = isValidClient(request, {
      clientId: 'a-client',
      clientSecret: 'a-secret'
    })

    // Assert
    expect(result).toBe(true)
  })

  test('it rejects a mismatched secret', () => {
    // Arrange
    const request = {
      headers: {},
      payload: { client_id: 'a-client', client_secret: 'the-wrong-secret' }
    }

    // Act
    const result = isValidClient(request, {
      clientId: 'a-client',
      clientSecret: 'a-secret'
    })

    // Assert
    expect(result).toBe(false)
  })

  test('it rejects a mismatched client id', () => {
    // Arrange
    const request = {
      headers: {},
      payload: { client_id: 'the-wrong-client', client_secret: 'a-secret' }
    }

    // Act
    const result = isValidClient(request, {
      clientId: 'a-client',
      clientSecret: 'a-secret'
    })

    // Assert
    expect(result).toBe(false)
  })
})
