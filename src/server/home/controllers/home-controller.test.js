import { describe, expect, test, vi } from 'vitest'
import { homeController } from './home-controller.js'

const mocks = {
  view: vi.fn()
}

const makeRequest = () => ({})
const makeH = () => ({ view: mocks.view })

describe('homeController()', () => {
  test('it renders the home page', () => {
    // Arrange
    mocks.view.mockReturnValue('view-response')
    const request = makeRequest()
    const h = makeH()

    // Act
    let result, error
    try {
      result = homeController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.view).toHaveBeenCalledWith('home/home', {
      pageTitle: 'Livestock fake service',
      heading: 'Livestock fake service',
      fakes: [
        {
          label: 'DEFRA CI',
          path: '/defra-ci/.well-known/openid-configuration'
        },
        {
          label: 'Entra ID',
          path: '/entra-id/.well-known/openid-configuration'
        }
      ]
    })
    expect(result).toBe('view-response')
  })
})
