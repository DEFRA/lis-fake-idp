import { describe, expect, test } from 'vitest'

import { buildUserItems } from './build-user-items.js'

const users = {
  'farmer@example.com': { name: 'Test Farmer' },
  'manager@example.com': {
    name: 'Test Manager',
    description: 'User with a supervisor role'
  }
}

describe('buildUserItems()', () => {
  test('it maps each fixture user to a radios item', () => {
    // Act
    const items = buildUserItems(users)

    // Assert
    expect(items).toEqual([
      {
        value: 'farmer@example.com',
        text: 'Test Farmer (farmer@example.com)',
        hint: undefined,
        checked: true
      },
      {
        value: 'manager@example.com',
        text: 'Test Manager (manager@example.com)',
        hint: { text: 'User with a supervisor role' },
        checked: false
      }
    ])
  })

  test('it checks the first user by default when none is selected', () => {
    // Act
    const items = buildUserItems(users)

    // Assert
    expect(items[0].checked).toBe(true)
    expect(items[1].checked).toBe(false)
  })

  test('it checks the selected user instead of the first one', () => {
    // Act
    const items = buildUserItems(users, 'manager@example.com')

    // Assert
    expect(items[0].checked).toBe(false)
    expect(items[1].checked).toBe(true)
  })
})
