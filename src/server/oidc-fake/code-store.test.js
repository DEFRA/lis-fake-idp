import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createCodeStore } from './code-store.js'

describe('createCodeStore()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('it redeems a stored code exactly once', () => {
    // Arrange
    const codeStore = createCodeStore()
    codeStore.storeCode('code-1', { sub: 'user-1' })

    // Act
    const first = codeStore.redeemCode('code-1')
    const second = codeStore.redeemCode('code-1')

    // Assert
    expect(first).toEqual(expect.objectContaining({ sub: 'user-1' }))
    expect(second).toBeNull()
  })

  test('it returns null for an unknown code', () => {
    // Arrange
    const codeStore = createCodeStore()

    // Act
    const result = codeStore.redeemCode('never-stored')

    // Assert
    expect(result).toBeNull()
  })

  test('it returns null once the code has expired', () => {
    // Arrange
    const codeStore = createCodeStore()
    codeStore.storeCode('code-1', { sub: 'user-1' })
    const tenMinutesAndOneSecond = 10 * 60 * 1000 + 1000

    // Act
    vi.advanceTimersByTime(tenMinutesAndOneSecond)
    const result = codeStore.redeemCode('code-1')

    // Assert
    expect(result).toBeNull()
  })
})
